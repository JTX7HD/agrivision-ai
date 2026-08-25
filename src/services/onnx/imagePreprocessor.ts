/**
 * Image Preprocessing Module
 * Preprocesses an input image Data URL into a normalized Float32 CHW tensor (1, 3, 224, 224)
 * using ImageNet mean [0.485, 0.456, 0.406] and std [0.229, 0.224, 0.225].
 */

export async function preprocessImageToTensor(
  imageDataUrl: string,
  targetWidth = 224,
  targetHeight = 224
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to obtain 2D rendering context for image preprocessing.'));
          return;
        }

        // Draw image resized to 224 x 224
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;

        const numPixels = targetWidth * targetHeight;
        const floatArray = new Float32Array(3 * numPixels);

        // ImageNet Normalization Constants
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];

        // Format into CHW (Channel, Height, Width) tensor layout
        for (let i = 0; i < numPixels; i++) {
          const r = data[i * 4] / 255.0;
          const g = data[i * 4 + 1] / 255.0;
          const b = data[i * 4 + 2] / 255.0;

          // Normalized CHW Float32 placement
          floatArray[i] = (r - mean[0]) / std[0];                   // R channel
          floatArray[numPixels + i] = (g - mean[1]) / std[1];       // G channel
          floatArray[numPixels * 2 + i] = (b - mean[2]) / std[2];   // B channel
        }

        resolve(floatArray);
      } catch (err) {
        reject(new Error(`Image preprocessing error: ${err instanceof Error ? err.message : String(err)}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load leaf image for ONNX preprocessing. Invalid image source.'));
    };

    img.src = imageDataUrl;
  });
}
