import type { CropId, FullAnalysisResult, PipelineStageStatus } from '../models/types';
import { getCropById } from '../data/cropsData';
import { getDefaultDiseaseKnowledgeForCrop } from '../data/diseasesData';
import { validateImageQuality } from './onnx/imageQualityCheck';
import { runONNXInference } from './onnx/inferenceEngine';

export interface AIServiceProgressCallback {
  (stage: PipelineStageStatus): void;
}

export const analyzeLeafPipeline = async (
  imageDataUrl: string,
  cropId: CropId,
  onProgress?: AIServiceProgressCallback
): Promise<FullAnalysisResult> => {
  const crop = getCropById(cropId);
  const scanId = `scan-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();

  // Stage 1: Image Quality Inspection
  const stage1: PipelineStageStatus = {
    id: 'quality',
    name: '1. Image Quality Inspection',
    modelName: 'Luminance & Contrast Analyzer',
    description: 'Verifying lighting, focus, and leaf visibility...',
    status: 'running',
    durationMs: 150
  };
  onProgress?.(stage1);

  const qualityCheck = await validateImageQuality(imageDataUrl);

  if (!qualityCheck.isSuitable) {
    stage1.status = 'failed';
    stage1.outputSummary = qualityCheck.issueDescription || 'Image quality unsuitable for AI model evaluation.';
    onProgress?.({ ...stage1 });
    throw new Error(qualityCheck.issueDescription || 'Image quality is too low for model analysis. Please retake a clear leaf photo.');
  }

  stage1.status = 'completed';
  stage1.outputSummary = 'Image quality verified (Good lighting and leaf contrast).';
  onProgress?.({ ...stage1 });

  // Stage 2: MobileNetV3 ONNX Disease Classification
  const stage2: PipelineStageStatus = {
    id: 'onnx',
    name: '2. MobileNetV3 ONNX Disease Classification',
    modelName: 'MobileNetV3 (public/models/tomato_disease_mobilenetv3.onnx)',
    description: 'Evaluating ImageNet-normalized Float32 tensor [1, 3, 224, 224] via client-side WASM runtime...',
    status: 'running',
    durationMs: 450
  };
  onProgress?.(stage2);

  let onnxResult = null;
  let disease = getDefaultDiseaseKnowledgeForCrop(cropId);

  try {
    onnxResult = await runONNXInference(imageDataUrl);
    disease = onnxResult.disease;
    stage2.durationMs = onnxResult.inferenceTimeMs;
    stage2.status = 'completed';
    stage2.outputSummary = `ONNX inference completed: Predicted ${disease.name} (${onnxResult.topConfidence}% confidence, ${onnxResult.confidenceLevel} confidence level).`;
  } catch (e) {
    console.error('ONNX model execution error:', e);
    stage2.status = 'failed';
    stage2.outputSummary = 'MobileNetV3 ONNX model classification failed.';
    onProgress?.({ ...stage2 });
    throw new Error(`ONNX Model Execution Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  onProgress?.({ ...stage2 });

  return {
    scanId,
    timestamp,
    crop,
    predictedClassIndex: onnxResult.predictedClassIndex,
    predictedClassName: onnxResult.predictedClassName,
    disease,
    imageUrl: imageDataUrl,
    pipelineStages: [stage1, stage2],
    confidence: onnxResult.topConfidence,
    confidenceLevel: onnxResult.confidenceLevel,
    confidenceLabel: onnxResult.confidenceLabel,
    classProbabilities: onnxResult.classProbabilities,
    rawLogits: onnxResult.rawLogits,
    imageQuality: qualityCheck,
    isMockPrediction: false,
    onnxInfo: {
      modelPath: '/models/tomato_disease_mobilenetv3.onnx',
      modelName: onnxResult.modelName,
      fileSizeBytes: 343346,
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 10],
      executionProvider: 'ONNX Runtime WebAssembly (WASM)',
      inferenceTimeMs: onnxResult.inferenceTimeMs
    }
  };
};
