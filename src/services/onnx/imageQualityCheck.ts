import type { ImageQualityStatus } from '../../models/types';

/**
 * Provisional Blur Threshold Documentation:
 * The default blur threshold of 35.0 (Laplacian variance of luminance) is provisional and empirical.
 * Because a dedicated, calibrated field dataset with standardized ground-truth focal depths across
 * various smallholder mobile phone lenses is not present in the local repository, this threshold
 * is established as an operational baseline to detect visibly blurred, out-of-focus, or smeared images
 * while avoiding rejection of sharp leaves captured under diffused or low-contrast ambient lighting.
 * It is not claimed to be a fully calibrated or scientifically validated optical benchmark.
 */
export const PROVISIONAL_BLUR_THRESHOLD = 35.0;
export const DEFAULT_MIN_BRIGHTNESS = 18;
export const DEFAULT_MAX_BRIGHTNESS = 248;
export const DEFAULT_MIN_CONTRAST = 5;

export interface ImageQualityOptions {
  /** Configurable blur threshold based on Laplacian variance (provisional default: 35.0). */
  blurThreshold?: number;
  /** Minimum average luminance (0-255). Below this is flagged as underexposed. Default: 18. */
  minBrightness?: number;
  /** Maximum average luminance (0-255). Above this is flagged as overexposed. Default: 248. */
  maxBrightness?: number;
  /** Minimum luminance standard deviation (0-128). Below this is flagged as blank/uniform. Default: 5. */
  minContrast?: number;
}

/**
 * Computes the variance of the 2D discrete Laplacian over a 1D grayscale luminance buffer.
 * Uses the standard 4-neighbor discrete Laplacian kernel:
 * [  0,  1,  0 ]
 * [  1, -4,  1 ]
 * [  0,  1,  0 ]
 *
 * For interior pixels (x in [1, width-2], y in [1, height-2]):
 *   lap(x, y) = Y(x-1, y) + Y(x+1, y) + Y(x, y-1) + Y(x, y+1) - 4 * Y(x, y)
 *
 * @param grayscale Float32Array, Uint8Array, or number[] of size (width * height)
 * @param width image width in pixels
 * @param height image height in pixels
 * @returns Variance of the Laplacian responses across interior pixels (>= 0).
 */
export function computeLaplacianVariance(
  grayscale: ArrayLike<number>,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) {
    // Too small for a 3x3 convolution kernel
    return 0;
  }

  const numInterior = (width - 2) * (height - 2);
  if (numInterior <= 0) return 0;

  let sum = 0;
  let sumSq = 0;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    const rowAbove = (y - 1) * width;
    const rowBelow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const center = grayscale[rowOffset + x];
      const left = grayscale[rowOffset + x - 1];
      const right = grayscale[rowOffset + x + 1];
      const up = grayscale[rowAbove + x];
      const down = grayscale[rowBelow + x];

      const lap = up + down + left + right - 4 * center;

      sum += lap;
      sumSq += lap * lap;
    }
  }

  const mean = sum / numInterior;
  const variance = sumSq / numInterior - mean * mean;

  return Math.max(0, variance);
}

/**
 * Pure evaluation function on raw RGBA pixel data.
 * Can be tested directly without DOM / Canvas dependencies.
 */
export function evaluateImageQualityFromPixels(
  data: ArrayLike<number>,
  width: number,
  height: number,
  options?: ImageQualityOptions
): ImageQualityStatus {
  const blurThreshold = options?.blurThreshold ?? PROVISIONAL_BLUR_THRESHOLD;
  const minBrightness = options?.minBrightness ?? DEFAULT_MIN_BRIGHTNESS;
  const maxBrightness = options?.maxBrightness ?? DEFAULT_MAX_BRIGHTNESS;
  const minContrast = options?.minContrast ?? DEFAULT_MIN_CONTRAST;

  const totalPixels = width * height;
  if (totalPixels <= 0) {
    return {
      isSuitable: false,
      issueDescription: 'Invalid image dimensions.'
    };
  }

  // 1. Calculate luminance values (standard ITU-R BT.601)
  const pixelLuminances = new Float32Array(totalPixels);
  let totalBrightness = 0;

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    pixelLuminances[i] = lum;
    totalBrightness += lum;
  }

  const avgBrightness = totalBrightness / totalPixels;

  // 2. Calculate luminance standard deviation (contrast)
  let varianceSum = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = pixelLuminances[i] - avgBrightness;
    varianceSum += diff * diff;
  }
  const contrast = Math.sqrt(varianceSum / totalPixels);

  // Check 1: Extremely dark image (underexposed)
  if (avgBrightness < minBrightness) {
    return {
      isSuitable: false,
      issueDescription: 'Image is extremely dark. Please take a clear photo in good natural lighting.',
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      isBlurry: false
    };
  }

  // Check 2: Extremely bright / washed out image (overexposed)
  if (avgBrightness > maxBrightness) {
    return {
      isSuitable: false,
      issueDescription: 'Image is overexposed or washed out. Please avoid glare or intense direct flash.',
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      isBlurry: false
    };
  }

  // Check 3: Completely uniform / blank image (contrast too low)
  if (contrast < minContrast) {
    return {
      isSuitable: false,
      issueDescription: 'Image appears blank or uniform. Please capture a clear, focused photo of a plant leaf.',
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      isBlurry: false
    };
  }

  // Safe handling for small images: if dimensions are too small for reliable blur analysis (< 16x16)
  if (width < 16 || height < 16) {
    return {
      isSuitable: true,
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      isBlurry: false
    };
  }

  // Check 4: Blur Detection via Laplacian Variance
  const laplacianVar = computeLaplacianVariance(pixelLuminances, width, height);

  // Contrast-adaptive blur threshold:
  // In low-contrast images (5 <= contrast < 25), gradients are naturally scaled down by contrast.
  // To avoid rejecting sharp low-contrast images, scale the effective threshold by (contrast / 25)^2.
  const contrastScale = contrast < 25 ? Math.pow(contrast / 25, 2) : 1.0;
  const effectiveThreshold = blurThreshold * contrastScale;

  if (laplacianVar < effectiveThreshold) {
    return {
      isSuitable: false,
      issueDescription: 'Image appears blurry or out of focus. Please hold your camera steady, ensure good lighting, and take a sharp, close-up photo of the leaf.',
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      blurScore: Math.round(laplacianVar * 10) / 10,
      isBlurry: true
    };
  }

  return {
    isSuitable: true,
    brightness: Math.round(avgBrightness),
    contrast: Math.round(contrast),
    blurScore: Math.round(laplacianVar * 10) / 10,
    isBlurry: false
  };
}

/**
 * Validates image quality (underexposure, overexposure, blank image, blur detection)
 * from a browser image Data URL.
 */
export async function validateImageQuality(
  imageDataUrl: string,
  options?: ImageQualityOptions
): Promise<ImageQualityStatus> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // In non-DOM test/SSR environments, return safe status
      resolve({
        isSuitable: true,
        brightness: 128,
        contrast: 40,
        blurScore: 100,
        isBlurry: false
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width || 100;
        const naturalHeight = img.naturalHeight || img.height || 100;

        // Constrain analysis size to max 256px to balance speed and high-frequency edge fidelity
        const maxDim = 256;
        let width = naturalWidth;
        let height = naturalHeight;

        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.max(1, Math.round((height * maxDim) / width));
            width = maxDim;
          } else {
            width = Math.max(1, Math.round((width * maxDim) / height));
            height = maxDim;
          }
        }

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

        const status = evaluateImageQualityFromPixels(
          imgData.data,
          width,
          height,
          options
        );

        resolve(status);
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
