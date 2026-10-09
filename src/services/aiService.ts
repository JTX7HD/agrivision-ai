import type { CropId, FullAnalysisResult, PipelineStageStatus } from '../models/types';
import { defaultPipelineOrchestrator } from './pipeline/pipelineOrchestrator';

export type AIServiceProgressCallback = (stage: PipelineStageStatus) => void;

/**
 * Executes the full modular AgriVision AI pipeline:
 * 1. Image Quality Inspection
 * 2. YOLO Leaf Detection (ROI extraction)
 * 3. SAM Leaf Segmentation
 * 4. MobileNetV3 V2 Disease Classification (baseline: best_tomato_mobilenetv3_v2.pth)
 * 5. Confidence Score & Probability Thresholding
 * 6. LIME Explainability
 * 7. Disease Pathology & Treatment/Prevention Guidance
 */
export const analyzeLeafPipeline = async (
  imageDataUrl: string,
  cropId: CropId,
  onProgress?: AIServiceProgressCallback
): Promise<FullAnalysisResult> => {
  return await defaultPipelineOrchestrator.run(imageDataUrl, {
    cropId,
    onProgress
  });
};

export { defaultPipelineOrchestrator } from './pipeline/pipelineOrchestrator';
export { defaultDiseaseClassifier, MOBILENETV3_V2_METADATA } from './pipeline/diseaseClassifierService';
export { defaultLeafDetector } from './pipeline/leafDetectionService';
export { defaultLeafSegmenter } from './pipeline/leafSegmentationService';
export { defaultExplainabilityEngine } from './explainability/limeExplainer';
