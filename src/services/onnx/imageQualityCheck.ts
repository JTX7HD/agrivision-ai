import type { ImageQualityStatus } from '../../models/types';

export async function validateImageQuality(
  imageDataUrl: string
): Promise<ImageQualityStatus> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = 100;
        const height = 100;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({ isSuitable: true });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        let totalBrightness = 0;
        const pixelLuminances: number[] = [];

        for (let i = 0; i < totalPixels; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];

          // Standard RGB luminance formula
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += lum;
          pixelLuminances.push(lum);
        }

        const avgBrightness = totalBrightness / totalPixels;

        // Calculate luminance variance/contrast (standard deviation)
        let varianceSum = 0;
        for (let i = 0; i < totalPixels; i++) {
          const diff = pixelLuminances[i] - avgBrightness;
          varianceSum += diff * diff;
        }
        const stdDev = Math.sqrt(varianceSum / totalPixels);

        // Check 1: Extremely dark image (brightness < 18)
        if (avgBrightness < 18) {
          resolve({
            isSuitable: false,
            issueDescription: 'Image is extremely dark. Please take a clear photo in good natural lighting.',
            brightness: Math.round(avgBrightness),
            contrast: Math.round(stdDev)
          });
          return;
        }

        // Check 2: Extremely bright / washed out image (brightness > 248)
        if (avgBrightness > 248) {
          resolve({
            isSuitable: false,
            issueDescription: 'Image is overexposed or washed out. Please avoid glare or intense direct flash.',
            brightness: Math.round(avgBrightness),
            contrast: Math.round(stdDev)
          });
          return;
        }

        // Check 3: Completely uniform / blank image (stdDev < 5)
        if (stdDev < 5) {
          resolve({
            isSuitable: false,
            issueDescription: 'Image appears blank or uniform. Please capture a clear, focused photo of a plant leaf.',
            brightness: Math.round(avgBrightness),
            contrast: Math.round(stdDev)
          });
          return;
        }

        resolve({
          isSuitable: true,
          brightness: Math.round(avgBrightness),
          contrast: Math.round(stdDev)
        });
      } catch (err) {
        console.warn('Image quality validation check warning:', err);
        resolve({ isSuitable: true });
      }
    };

    img.onerror = () => {
      resolve({
        isSuitable: false,
        issueDescription: 'Invalid image format or corrupted image file. Please select a valid photo.'
      });
    };

    img.src = imageDataUrl;
  });
}
