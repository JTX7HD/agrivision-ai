import type { LeafDetection, LeafSegmentation } from '../../models/types';
import type { ILeafSegmenter } from './types';

/**
 * Baseline Leaf Segmenter (Pass-through)
 * Acts as the pluggable adapter for SAM (Segment Anything Model).
 * Future SAM segmentation model can implement ILeafSegmenter and replace this without UI changes.
 */
export class PassThroughLeafSegmenter implements ILeafSegmenter {
  public readonly name = 'Leaf Segmentation & Background Isolation';
  public readonly modelIdentifier = 'SAM-Ready Segmenter Interface';

  public async segmentLeaf(
    imageDataUrl: string,
    detection: LeafDetection
  ): Promise<LeafSegmentation> {
    return {
      detectionId: detection.id,
      isolatedLeafImageUrl: detection.croppedImageUrl || imageDataUrl,
      areaRatio: 0.85
    };
  }
}

/**
 * Singleton instance of default segmenter
 */
export const defaultLeafSegmenter = new PassThroughLeafSegmenter();
