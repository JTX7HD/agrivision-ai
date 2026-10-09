import type { BoundingBox } from '../../models/types';

/**
 * Crops a bounding box region of interest (ROI) from an image data URL or image source.
 * Handles normalized coordinates [0..1] or pixel coordinates.
 */
export async function cropLeafROI(
  imageSource: string,
  box: BoundingBox
): Promise<string> {
  // If box covers full image or invalid, return original image source
  if (
    box.x <= 0 &&
    box.y <= 0 &&
    (box.width >= 1 || box.width >= 9999) &&
    (box.height >= 1 || box.height >= 9999)
  ) {
    return imageSource;
  }

  return new Promise((resolve) => {
    // If not in a browser/canvas environment (e.g. node test), resolve with source
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(imageSource);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const naturalWidth = img.naturalWidth || img.width || 224;
        const naturalHeight = img.naturalHeight || img.height || 224;

        let sx = box.x;
        let sy = box.y;
        let sWidth = box.width;
        let sHeight = box.height;

        // Convert normalized [0..1] to pixel coordinates if needed
        if (box.coordinateType === 'normalized' || (sWidth <= 1.0 && sHeight <= 1.0)) {
          sx = Math.max(0, Math.floor(box.x * naturalWidth));
          sy = Math.max(0, Math.floor(box.y * naturalHeight));
          sWidth = Math.min(naturalWidth - sx, Math.floor(box.width * naturalWidth));
          sHeight = Math.min(naturalHeight - sy, Math.floor(box.height * naturalHeight));
        } else {
          sx = Math.max(0, Math.min(naturalWidth, box.x));
          sy = Math.max(0, Math.min(naturalHeight, box.y));
          sWidth = Math.min(naturalWidth - sx, box.width);
          sHeight = Math.min(naturalHeight - sy, box.height);
        }

        // Clamp minimum size to prevent 0px canvas errors
        sWidth = Math.max(16, sWidth);
        sHeight = Math.max(16, sHeight);

        canvas.width = sWidth;
        canvas.height = sHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSource);
          return;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('cropLeafROI fallback to source image:', err);
        resolve(imageSource);
      }
    };

    img.onerror = () => {
      resolve(imageSource);
    };

    img.src = imageSource;
  });
}
