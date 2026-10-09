import type { LeafDetection, BoundingBox } from '../../models/types';
import type { ILeafDetector } from './types';
import { loadInferenceSession } from '../onnx/modelLoader';
import { cropLeafROI } from './imageUtils';

/**
 * Preprocesses an input image Data URL into a Float32 CHW tensor [1, 3, 640, 640]
 * normalized to [0.0, 1.0] for YOLO11n leaf detection.
 */
async function preprocessImageForYOLO(
  imageDataUrl: string,
  targetWidth = 640,
  targetHeight = 640
): Promise<{ float32Data: Float32Array; naturalWidth: number; naturalHeight: number }> {
  let safeDataUrl = imageDataUrl;
  if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
    try {
      const res = await fetch(imageDataUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        safeDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn('CORS fetch warning for YOLO preprocessing:', e);
    }
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // In non-DOM environments, provide a fallback tensor structure
      resolve({
        float32Data: new Float32Array(3 * targetWidth * targetHeight),
        naturalWidth: targetWidth,
        naturalHeight: targetHeight
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width || targetWidth;
        const naturalHeight = img.naturalHeight || img.height || targetHeight;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to obtain 2D rendering context for YOLO preprocessing.'));
          return;
        }

        // Direct resize to 640x640 canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        const numPixels = targetWidth * targetHeight;
        const floatArray = new Float32Array(3 * numPixels);

        // Normalize RGB pixel intensities to [0.0, 1.0] in planar CHW order
        for (let i = 0; i < numPixels; i++) {
          const r = data[i * 4] / 255.0;
          const g = data[i * 4 + 1] / 255.0;
          const b = data[i * 4 + 2] / 255.0;

          floatArray[i] = r;
          floatArray[numPixels + i] = g;
          floatArray[numPixels * 2 + i] = b;
        }

        resolve({ float32Data: floatArray, naturalWidth, naturalHeight });
      } catch (err) {
        reject(new Error(`YOLO preprocessing error: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for YOLO detection.'));
    };

    img.src = safeDataUrl;
  });
}

/**
 * Production YOLO11n Leaf Detector
 * Model: public/models/yolo11n_leaf_v1_best.onnx
 * Input: images [1, 3, 640, 640]
 * Output: output0 [1, 300, 6] (NMS pre-applied; [x1, y1, x2, y2, confidence, classId])
 * Class 0 = leaf
 */
export class YOLOLeafDetector implements ILeafDetector {
  public readonly name = 'YOLO11n Leaf Detection & ROI Extraction';
  public readonly modelIdentifier = 'yolo11n_leaf_v1_best.onnx';

  public async detectLeaves(
    imageDataUrl: string,
    confidenceThreshold = 0.25
  ): Promise<LeafDetection[]> {
    const startTime = performance.now();

    // Step 1: Preprocess to [1, 3, 640, 640]
    const { float32Data, naturalWidth, naturalHeight } = await preprocessImageForYOLO(
      imageDataUrl,
      640,
      640
    );

    // Step 2: Load ONNX session for YOLO11n
    const modelPath = '/models/yolo11n_leaf_v1_best.onnx';
    const session = await loadInferenceSession(modelPath);
    if (!session) {
      throw new Error(
        `Failed to initialize YOLO11n leaf detector session from '${modelPath}'. Ensure 'yolo11n_leaf_v1_best.onnx' is present in public/models/.`
      );
    }

    // Step 3: Run YOLO ONNX inference
    const ort = await import('onnxruntime-web');
    const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);
    const inputName = session.inputNames[0] || 'images';
    const feeds: Record<string, any> = { [inputName]: inputTensor };

    const results = await session.run(feeds);
    const outputName = session.outputNames[0] || 'output0';
    const outputTensor = results[outputName];

    if (!outputTensor || !outputTensor.data) {
      throw new Error(`YOLO inference returned empty output tensor from '${modelPath}'.`);
    }

    const data = outputTensor.data as Float32Array;
    // Expected output shape: [1, 300, 6] -> 1800 floats
    const numBoxes = Math.floor(data.length / 6);

    interface ValidLeafBox {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      confidence: number;
      classId: number;
    }

    const validDetections: ValidLeafBox[] = [];

    for (let i = 0; i < numBoxes; i++) {
      const offset = i * 6;
      const x1 = data[offset];
      const y1 = data[offset + 1];
      const x2 = data[offset + 2];
      const y2 = data[offset + 3];
      const conf = data[offset + 4];
      const cls = Math.round(data[offset + 5]);

      // Only accept class 0 (leaf) with confidence >= threshold
      if (cls === 0 && conf >= confidenceThreshold) {
        validDetections.push({ x1, y1, x2, y2, confidence: conf, classId: cls });
      }
    }

    // Sort descending by confidence
    validDetections.sort((a, b) => b.confidence - a.confidence);

    if (validDetections.length === 0) {
      console.warn(`[YOLO11n] No leaf detected with confidence >= ${confidenceThreshold}`);
      return [];
    }

    const scaleX = naturalWidth / 640.0;
    const scaleY = naturalHeight / 640.0;

    const detections: LeafDetection[] = [];

    // Process valid leaf detections
    for (let idx = 0; idx < validDetections.length; idx++) {
      const b = validDetections[idx];

      // Convert 640x640 model coordinates back to original image dimensions
      const clampedX1 = Math.max(0, Math.min(naturalWidth, b.x1 * scaleX));
      const clampedY1 = Math.max(0, Math.min(naturalHeight, b.y1 * scaleY));
      const clampedX2 = Math.max(0, Math.min(naturalWidth, b.x2 * scaleX));
      const clampedY2 = Math.max(0, Math.min(naturalHeight, b.y2 * scaleY));

      const boxWidth = Math.max(16, clampedX2 - clampedX1);
      const boxHeight = Math.max(16, clampedY2 - clampedY1);

      // Normalized coordinates [0.0 .. 1.0]
      const normBox: BoundingBox = {
        x: clampedX1 / naturalWidth,
        y: clampedY1 / naturalHeight,
        width: boxWidth / naturalWidth,
        height: boxHeight / naturalHeight,
        coordinateType: 'normalized'
      };

      // Crop the ORIGINAL image using this bounding box
      const croppedImageUrl = await cropLeafROI(imageDataUrl, normBox);

      detections.push({
        id: `leaf-yolo-${idx + 1}`,
        box: normBox,
        confidence: Math.round(b.confidence * 1000) / 1000,
        label: `Target Leaf (${(b.confidence * 100).toFixed(1)}%)`,
        croppedImageUrl
      });
    }

    const durationMs = Math.round(performance.now() - startTime);

    console.group('%c[AgriVision AI] YOLO11n Leaf Detection Pipeline Trace', 'color: #10b981; font-weight: bold; font-size: 13px;');
    console.log('1. Model Path:', modelPath);
    console.log('2. Input Shape: [1, 3, 640, 640]');
    console.log('3. Output Shape: [1, 300, 6]');
    console.log('4. Total Detections (conf >= 0.25):', detections.length);
    console.log('5. Primary Leaf Confidence:', (detections[0].confidence * 100).toFixed(1) + '%');
    console.log('6. Primary Leaf Bounding Box (Normalized):', detections[0].box);
    console.log('7. Detection Duration:', durationMs + 'ms');
    console.groupEnd();

    return detections;
  }
}

/**
 * Singleton instance of YOLO leaf detector
 */
export const defaultLeafDetector = new YOLOLeafDetector();
