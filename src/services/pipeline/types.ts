import type {
  CropId,
  FullAnalysisResult,
  PipelineStageStatus,
  ImageQualityStatus,
  LeafDetection,
  LeafSegmentation,
  LimeExplanation,
  ClassifierModelInfo
} from '../../models/types';
import type { FormattedONNXResult } from '../onnx/resultFormatter';

export interface AIServiceProgressCallback {
  (stage: PipelineStageStatus): void;
}

/**
 * Interface for Image Quality Validation Stage
 */
export interface IImageQualityValidator {
  validate(imageDataUrl: string): Promise<ImageQualityStatus>;
}

/**
 * Interface for Leaf Detection Stage (e.g., YOLO Leaf Detector)
 */
export interface ILeafDetector {
  readonly name: string;
  readonly modelIdentifier: string;
  detectLeaves(imageDataUrl: string): Promise<LeafDetection[]>;
}

/**
 * Interface for Leaf Segmentation Stage (e.g., SAM Segmenter)
 */
export interface ILeafSegmenter {
  readonly name: string;
  readonly modelIdentifier: string;
  segmentLeaf(imageDataUrl: string, detection: LeafDetection): Promise<LeafSegmentation>;
}

/**
 * Interface for Disease Classification Stage (e.g., MobileNetV3 V2)
 */
export interface IDiseaseClassifier {
  readonly name: string;
  readonly modelIdentifier: string;
  readonly modelInfo: ClassifierModelInfo;
  classify(
    imageDataUrl: string,
    cropId: CropId,
    options?: { modelPath?: string }
  ): Promise<FormattedONNXResult>;
}

/**
 * Interface for Explainability Stage (e.g., LIME Engine)
 */
export interface IExplainabilityEngine {
  readonly name: string;
  readonly modelIdentifier: string;
  explain(
    imageDataUrl: string,
    classificationResult: FormattedONNXResult,
    targetClassIndex?: number
  ): Promise<LimeExplanation>;
}

/**
 * Configuration options for the pipeline execution
 */
export interface PipelineRunOptions {
  cropId: CropId;
  enableMultiLeaf?: boolean;
  enableSegmentation?: boolean;
  enableExplainability?: boolean;
  onProgress?: AIServiceProgressCallback;
}

/**
 * Interface for the Master Pipeline Orchestrator
 */
export interface IPipelineOrchestrator {
  setDetector(detector: ILeafDetector): void;
  setSegmenter(segmenter: ILeafSegmenter): void;
  setClassifier(classifier: IDiseaseClassifier): void;
  setExplainer(explainer: IExplainabilityEngine): void;
  run(imageDataUrl: string, options: PipelineRunOptions): Promise<FullAnalysisResult>;
}
