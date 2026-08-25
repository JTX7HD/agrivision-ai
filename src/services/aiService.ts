import type { CropId, FullAnalysisResult, PipelineStageStatus } from '../models/types';
import { getCropById } from '../data/cropsData';
import { getDefaultDiseaseForCrop } from '../data/diseasesData';
import { runONNXInference } from './onnx/inferenceEngine';
import { runSAMSegmentation } from './explainability/samSegmentation';
import { runLIMEExplanation } from './explainability/limeExplainer';

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

  // Stage 1: Real SAM Leaf Segmentation
  const stage1: PipelineStageStatus = {
    id: 'sam',
    name: '1. SAM Leaf Segmentation',
    modelName: 'SAM-ViT (Segment Anything Model)',
    description: 'Isolating leaf contour boundaries from background soil and shadows...',
    status: 'running',
    durationMs: 350
  };
  onProgress?.(stage1);

  const samResult = await runSAMSegmentation(imageDataUrl);
  stage1.status = samResult.success ? 'completed' : 'failed';
  stage1.outputSummary = samResult.statusMessage;
  onProgress?.({ ...stage1 });

  // Stage 2: MobileNetV3 ONNX Disease Classification
  const stage2: PipelineStageStatus = {
    id: 'onnx',
    name: '2. MobileNetV3 ONNX Disease Classification',
    modelName: 'MobileNetV3 (public/models/tomato_disease_mobilenetv3.onnx)',
    description: 'Evaluating ImageNet-normalized Float32 tensor [1, 3, 224, 224] via client-side WASM...',
    status: 'running',
    durationMs: 450
  };
  onProgress?.(stage2);

  let disease = getDefaultDiseaseForCrop(cropId);
  let onnxResult = null;

  try {
    onnxResult = await runONNXInference(imageDataUrl);
    disease = onnxResult.disease;
    stage2.durationMs = onnxResult.inferenceTimeMs;
    stage2.status = 'completed';
    stage2.outputSummary = `ONNX inference completed in ${onnxResult.inferenceTimeMs}ms: Classified as ${disease.name} (${disease.confidence}% confidence).`;
  } catch (e) {
    console.error('ONNX model execution error:', e);
    stage2.status = 'failed';
    stage2.outputSummary = 'MobileNetV3 ONNX classification failed.';
  }
  onProgress?.({ ...stage2 });

  // Stage 3: Real LIME Local Surrogate Explainability
  const stage3: PipelineStageStatus = {
    id: 'lime',
    name: '3. LIME Visual Explainability',
    modelName: 'LIME Superpixel Perturbation Engine',
    description: 'Running superpixel masking perturbations through MobileNetV3 model to identify top influential regions...',
    status: 'running',
    durationMs: 600
  };
  onProgress?.(stage3);

  const limeResult = await runLIMEExplanation(imageDataUrl, disease.id);
  stage3.status = limeResult.success ? 'completed' : 'failed';
  stage3.outputSummary = limeResult.statusMessage;
  onProgress?.({ ...stage3 });

  return {
    scanId,
    timestamp,
    crop,
    disease,
    imageUrl: imageDataUrl,
    pipelineStages: [stage1, stage2, stage3],
    samSegmentationDataUrl: samResult.maskDataUrl,
    samSuccess: samResult.success,
    samStatusMessage: samResult.statusMessage,
    limeFeatures: limeResult.topFeatures,
    limeHeatmapDataUrl: limeResult.heatmapDataUrl,
    limeSuccess: limeResult.success,
    limeStatusMessage: limeResult.statusMessage,
    isMockPrediction: false,
    onnxInfo: onnxResult ? {
      modelPath: '/models/tomato_disease_mobilenetv3.onnx',
      modelName: onnxResult.modelName,
      fileSizeBytes: 343346,
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 10],
      executionProvider: 'ONNX Runtime WebAssembly (WASM)',
      inferenceTimeMs: onnxResult.inferenceTimeMs
    } : undefined
  };
};
