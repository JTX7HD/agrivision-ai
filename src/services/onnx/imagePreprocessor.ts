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
  // Ensure external http/https URLs are fetched cleanly as Blobs to avoid CORS canvas tainting
  let safeDataUrl = imageDataUrl;
  if (imageDataUrl.startsWith('http://') || imageDataUrl.startsWith('https://')) {
    try {
      const res = await fetch(imageDataUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        safeDataUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {
      console.warn('CORS fetch fallback for image preprocessing:', e);
    }
  }

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

        // Calculate aspect-preserving center crop parameters
        const srcWidth = img.width;
        const srcHeight = img.height;
        const srcAspect = srcWidth / srcHeight;
        const targetAspect = targetWidth / targetHeight;

        let sx = 0, sy = 0, sw = srcWidth, sh = srcHeight;
        if (srcAspect > targetAspect) {
          sw = srcHeight * targetAspect;
          sx = (srcWidth - sw) / 2;
        } else {
          sh = srcWidth / targetAspect;
          sy = (srcHeight - sh) / 2;
        }

        // Draw center-cropped aspect-preserved leaf image onto 224x224 canvas
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
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

    img.src = safeDataUrl;
  });
}
