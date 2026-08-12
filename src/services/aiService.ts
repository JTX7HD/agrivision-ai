import type { CropId, FullAnalysisResult, PipelineStageStatus, BoundingBox, LimeFeature } from '../models/types';
import { getCropById } from '../data/cropsData';
import { getDefaultDiseaseForCrop } from '../data/diseasesData';

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

  // Stage 1: YOLO11 Object Detection
  const stage1: PipelineStageStatus = {
    id: 'yolo11',
    name: '1. Leaf Detection',
    modelName: 'YOLO11x-CropVision',
    description: 'Scanning image frame for leaf geometry and spatial bounding boxes...',
    status: 'running',
    durationMs: 450
  };
  onProgress?.(stage1);
  await new Promise((r) => setTimeout(r, 600));

  const yoloBoundingBox: BoundingBox = {
    x: 15 + Math.floor(Math.random() * 10),
    y: 18 + Math.floor(Math.random() * 10),
    width: 65 + Math.floor(Math.random() * 8),
    height: 60 + Math.floor(Math.random() * 8),
    label: `${crop.name} Leaf`,
    confidence: 0.95 + Math.random() * 0.04
  };

  stage1.status = 'completed';
  stage1.outputSummary = `Leaf detected with ${(yoloBoundingBox.confidence * 100).toFixed(1)}% confidence bbox [${yoloBoundingBox.x}%, ${yoloBoundingBox.y}%, ${yoloBoundingBox.width}%, ${yoloBoundingBox.height}%]`;
  onProgress?.({ ...stage1 });

  // Stage 2: SAM (Segment Anything Model)
  const stage2: PipelineStageStatus = {
    id: 'sam',
    name: '2. Leaf Segmentation & Isolation',
    modelName: 'SAM-ViT-Huge (Segment Anything)',
    description: 'Removing background soil, shadows, and isolating exact leaf contours...',
    status: 'running',
    durationMs: 700
  };
  onProgress?.(stage2);
  await new Promise((r) => setTimeout(r, 750));

  stage2.status = 'completed';
  stage2.outputSummary = 'Background removed. Isolated leaf mask coverage: 78.4% of ROI.';
  onProgress?.({ ...stage2 });

  // Stage 3: ResNet-50 Disease Classification
  const stage3: PipelineStageStatus = {
    id: 'resnet50',
    name: '3. Disease Classification',
    modelName: 'ResNet-50 (Fine-Tuned Transfer Learning)',
    description: 'Evaluating deep convolutional feature maps against crop pathogen database...',
    status: 'running',
    durationMs: 650
  };
  onProgress?.(stage3);
  await new Promise((r) => setTimeout(r, 700));

  const disease = getDefaultDiseaseForCrop(cropId);

  stage3.status = 'completed';
  stage3.outputSummary = `Classified as ${disease.name} (${disease.confidence}% confidence, ${disease.severity} severity).`;
  onProgress?.({ ...stage3 });

  // Stage 4: LIME Explainability Heatmap
  const stage4: PipelineStageStatus = {
    id: 'lime',
    name: '4. LIME Visual Explainability',
    modelName: 'LIME Perturbation Analyzer',
    description: 'Generating superpixel feature importance heatmaps to highlight diagnostic lesions...',
    status: 'running',
    durationMs: 500
  };
  onProgress?.(stage4);
  await new Promise((r) => setTimeout(r, 600));

  const limeFeatures: LimeFeature[] = [
    {
      id: 'lime-1',
      x: yoloBoundingBox.x + 20,
      y: yoloBoundingBox.y + 25,
      radius: 14,
      importanceScore: 0.89,
      type: 'positive',
      label: 'Primary Lesion Cluster'
    },
    {
      id: 'lime-2',
      x: yoloBoundingBox.x + 42,
      y: yoloBoundingBox.y + 38,
      radius: 11,
      importanceScore: 0.76,
      type: 'positive',
      label: 'Chlorotic Yellow Halo'
    },
    {
      id: 'lime-3',
      x: yoloBoundingBox.x + 10,
      y: yoloBoundingBox.y + 45,
      radius: 9,
      importanceScore: 0.62,
      type: 'positive',
      label: 'Concentric Ring Texture'
    }
  ];

  stage4.status = 'completed';
  stage4.outputSummary = 'Generated 3 diagnostic superpixel clusters driving neural decision.';
  onProgress?.({ ...stage4 });

  const samSegmentationDataUrl = imageDataUrl;
  const limeHeatmapDataUrl = imageDataUrl;

  return {
    scanId,
    timestamp,
    crop,
    disease,
    imageUrl: imageDataUrl,
    pipelineStages: [stage1, stage2, stage3, stage4],
    yoloBoundingBox,
    samSegmentationDataUrl,
    limeFeatures,
    limeHeatmapDataUrl,
    isMockPrediction: true
  };
};
