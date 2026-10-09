import type {
  FullAnalysisResult,
  PipelineStageStatus,
  DetectedLeafAnalysis,
  LeafDetection
} from '../../models/types';
import { getCropById } from '../../data/cropsData';
import { validateImageQuality } from '../onnx/imageQualityCheck';
import { defaultLeafDetector } from './leafDetectionService';
import { defaultLeafSegmenter } from './leafSegmentationService';
import { defaultDiseaseClassifier, MOBILENETV3_V2_METADATA } from './diseaseClassifierService';
import { defaultExplainabilityEngine } from '../explainability/limeExplainer';
import type {
  ILeafDetector,
  ILeafSegmenter,
  IDiseaseClassifier,
  IExplainabilityEngine,
  IPipelineOrchestrator,
  PipelineRunOptions
} from './types';

/**
 * AgriVision AI Pipeline Orchestrator
 * Coordinates:
 * 1. Image Quality Inspection
 * 2. YOLO Leaf Detection & ROI Extraction
 * 3. SAM Leaf Segmentation
 * 4. MobileNetV3 V2 Disease Classification
 * 5. Confidence Scoring & Thresholding
 * 6. LIME Explainability
 * 7. Disease Pathology & Treatment/Prevention Guidance
 */
export class PipelineOrchestrator implements IPipelineOrchestrator {
  private detector: ILeafDetector = defaultLeafDetector;
  private segmenter: ILeafSegmenter = defaultLeafSegmenter;
  private classifier: IDiseaseClassifier = defaultDiseaseClassifier;
  private explainer: IExplainabilityEngine = defaultExplainabilityEngine;

  public setDetector(detector: ILeafDetector): void {
    this.detector = detector;
  }

  public setSegmenter(segmenter: ILeafSegmenter): void {
    this.segmenter = segmenter;
  }

  public setClassifier(classifier: IDiseaseClassifier): void {
    this.classifier = classifier;
  }

  public setExplainer(explainer: IExplainabilityEngine): void {
    this.explainer = explainer;
  }

  public async run(
    imageDataUrl: string,
    options: PipelineRunOptions
  ): Promise<FullAnalysisResult> {
    const { cropId, onProgress } = options;
    const crop = getCropById(cropId);
    const scanId = `scan-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const stages: PipelineStageStatus[] = [];

    // -------------------------------------------------------------
    // Stage 1: Image Quality Inspection
    // -------------------------------------------------------------
    const stageQuality: PipelineStageStatus = {
      id: 'quality',
      name: '1. Image Quality Inspection',
      modelName: 'Luminance & Contrast Analyzer',
      description: 'Verifying lighting, focus, and leaf visibility...',
      status: 'running',
      durationMs: 120
    };
    onProgress?.(stageQuality);

    const qualityCheck = await validateImageQuality(imageDataUrl);

    if (!qualityCheck.isSuitable) {
      stageQuality.status = 'failed';
      stageQuality.outputSummary =
        qualityCheck.issueDescription || 'Image quality unsuitable for AI model evaluation.';
      onProgress?.({ ...stageQuality });
      throw new Error(
        qualityCheck.issueDescription ||
          'Image quality is too low for model analysis. Please retake a clear leaf photo.'
      );
    }

    stageQuality.status = 'completed';
    stageQuality.outputSummary = 'Image quality verified (Good lighting and leaf contrast).';
    stages.push({ ...stageQuality });
    onProgress?.({ ...stageQuality });

    // -------------------------------------------------------------
    // Stage 2: Leaf Detection & ROI (YOLO Interface)
    // -------------------------------------------------------------
    const stageDetection: PipelineStageStatus = {
      id: 'detection',
      name: '2. YOLO Leaf Detection & ROI',
      modelName: this.detector.modelIdentifier,
      description: 'Scanning image frame to detect leaf bounding box geometry...',
      status: 'running',
      durationMs: 80
    };
    onProgress?.(stageDetection);

    let detections: LeafDetection[] = [];
    try {
      detections = await this.detector.detectLeaves(imageDataUrl);
    } catch (err) {
      stageDetection.status = 'failed';
      stageDetection.outputSummary = `YOLO leaf detection error: ${err instanceof Error ? err.message : String(err)}`;
      onProgress?.({ ...stageDetection });
      throw new Error(`YOLO Leaf Detection Failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!detections || detections.length === 0) {
      stageDetection.status = 'failed';
      stageDetection.outputSummary = 'No leaf detected: YOLO11n did not detect any plant leaf in this photo (confidence threshold: 25%).';
      onProgress?.({ ...stageDetection });
      throw new Error(
        'No leaf detected: YOLO11n did not detect any plant leaf in this photo (confidence threshold: 25%). Please upload a clear photo of an affected leaf.'
      );
    }

    const primaryDetection = detections[0];

    stageDetection.status = 'completed';
    stageDetection.outputSummary = `Leaf detected with ${(primaryDetection.confidence * 100).toFixed(1)}% YOLO confidence (${detections.length} leaf ROI(s) found). Primary ROI cropped from original image.`;
    stages.push({ ...stageDetection });
    onProgress?.({ ...stageDetection });

    // -------------------------------------------------------------
    // Stage 3: Leaf Segmentation (SAM Interface)
    // -------------------------------------------------------------
    const stageSegmentation: PipelineStageStatus = {
      id: 'segmentation',
      name: '3. SAM Leaf Segmentation',
      modelName: this.segmenter.modelIdentifier,
      description: 'Isolating leaf margins and suppressing background soil/shadows...',
      status: 'running',
      durationMs: 90
    };
    onProgress?.(stageSegmentation);

    const segmentation = await this.segmenter.segmentLeaf(imageDataUrl, primaryDetection);

    stageSegmentation.status = 'completed';
    stageSegmentation.outputSummary = 'Leaf contour segmented successfully.';
    stages.push({ ...stageSegmentation });
    onProgress?.({ ...stageSegmentation });

    // -------------------------------------------------------------
    // Stage 4: Disease Classification (MobileNetV3 V2)
    // -------------------------------------------------------------
    const targetLeafImage =
      segmentation.isolatedLeafImageUrl || primaryDetection.croppedImageUrl || imageDataUrl;

    const stageClassification: PipelineStageStatus = {
      id: 'onnx',
      name: '4. MobileNetV3 Disease Classification',
      modelName: `MobileNetV3 V2 (${this.classifier.modelIdentifier})`,
      description: 'Evaluating ImageNet-normalized Float32 tensor [1, 3, 224, 224] via client-side WASM runtime...',
      status: 'running',
      durationMs: 450
    };
    onProgress?.(stageClassification);

    let classificationResult;
    try {
      classificationResult = await this.classifier.classify(targetLeafImage, cropId);
      stageClassification.durationMs = classificationResult.inferenceTimeMs;
      stageClassification.status = 'completed';
      stageClassification.outputSummary = `Predicted ${classificationResult.disease.name} (${classificationResult.topConfidence}% confidence, ${classificationResult.confidenceLevel} confidence level).`;
    } catch (e) {
      console.error('Classification error:', e);
      stageClassification.status = 'failed';
      stageClassification.outputSummary = 'MobileNetV3 disease classification failed.';
      onProgress?.({ ...stageClassification });
      throw new Error(`Model Execution Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    stages.push({ ...stageClassification });
    onProgress?.({ ...stageClassification });

    // -------------------------------------------------------------
    // Stage 5: LIME Explainability (LIME Interface)
    // -------------------------------------------------------------
    const stageExplainability: PipelineStageStatus = {
      id: 'lime',
      name: '5. LIME Visual Explainability',
      modelName: this.explainer.modelIdentifier,
      description: 'Computing superpixel feature importance and diagnostic attributions...',
      status: 'running',
      durationMs: 110
    };
    onProgress?.(stageExplainability);

    const limeExplanation = await this.explainer.explain(
      targetLeafImage,
      classificationResult
    );

    stageExplainability.status = 'completed';
    stageExplainability.outputSummary = 'Diagnostic feature attribution completed.';
    stages.push({ ...stageExplainability });
    onProgress?.({ ...stageExplainability });

    // -------------------------------------------------------------
    // Multi-leaf analysis construction
    // -------------------------------------------------------------
    const primaryLeafAnalysis: DetectedLeafAnalysis = {
      leafId: primaryDetection.id,
      detection: primaryDetection,
      segmentation,
      classIndex: classificationResult.predictedClassIndex,
      className: classificationResult.predictedClassName,
      confidence: classificationResult.topConfidence,
      classProbabilities: classificationResult.classProbabilities,
      explanation: limeExplanation
    };

    const detectedLeaves: DetectedLeafAnalysis[] = [primaryLeafAnalysis];

    // -------------------------------------------------------------
    // Return full unified result
    // -------------------------------------------------------------
    return {
      scanId,
      timestamp,
      crop,
      predictedClassIndex: classificationResult.predictedClassIndex,
      predictedClassName: classificationResult.predictedClassName,
      disease: classificationResult.disease,
      imageUrl: imageDataUrl,
      pipelineStages: stages,
      confidence: classificationResult.topConfidence,
      confidenceLevel: classificationResult.confidenceLevel,
      confidenceLabel: classificationResult.confidenceLabel,
      classProbabilities: classificationResult.classProbabilities,
      rawLogits: classificationResult.rawLogits,
      imageQuality: qualityCheck,
      isMockPrediction: false,
      detectedLeaves,
      primaryLeaf: primaryLeafAnalysis,
      explanation: limeExplanation,
      classifierInfo: MOBILENETV3_V2_METADATA,
      onnxInfo: {
        modelPath: '/models/tomato_mobilenetv3_v2.onnx',
        modelName: classificationResult.modelName,
        fileSizeBytes: 17142352,
        inputShape: [1, 3, 224, 224],
        outputShape: [1, 10],
        executionProvider: 'ONNX Runtime WebAssembly (WASM)',
        inferenceTimeMs: classificationResult.inferenceTimeMs
      }
    };
  }
}

/**
 * Singleton instance of master pipeline orchestrator
 */
export const defaultPipelineOrchestrator = new PipelineOrchestrator();
