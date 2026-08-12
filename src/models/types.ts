export type CropId = 'tomato' | 'potato' | 'maize' | 'rice' | 'banana' | 'chilli';

export type SeverityLevel = 'Healthy' | 'Mild' | 'Moderate' | 'Severe';

export interface Crop {
  id: CropId;
  name: string;
  scientificName: string;
  icon: string;
  accentColor: string;
  description: string;
  supported: boolean;
  commonDiseasesCount: number;
  sampleImageUrl: string;
}

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage
  height: number; // percentage
  label: string;
  confidence: number;
}

export interface LimeFeature {
  id: string;
  x: number; // percentage
  y: number; // percentage
  radius: number; // percentage
  importanceScore: number; // 0-1 scale
  type: 'positive' | 'negative';
  label: string;
}

export interface DiseaseInfo {
  id: string;
  cropId: CropId;
  name: string;
  scientificName: string;
  severity: SeverityLevel;
  confidence: number; // 0-100
  description: string;
  symptoms: string[];
  immediateAction: string[];
  prevention: string[];
  biologicalControl?: string[];
  chemicalControl?: string[];
  researchPaperReference?: string;
}

export type PipelineStageId = 'yolo11' | 'sam' | 'resnet50' | 'lime';

export interface PipelineStageStatus {
  id: PipelineStageId;
  name: string;
  modelName: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  durationMs: number;
  outputSummary?: string;
  details?: Record<string, string | number>;
}

export interface FullAnalysisResult {
  scanId: string;
  timestamp: string;
  crop: Crop;
  disease: DiseaseInfo;
  imageUrl: string;
  pipelineStages: PipelineStageStatus[];
  yoloBoundingBox: BoundingBox;
  samSegmentationDataUrl: string;
  limeFeatures: LimeFeature[];
  limeHeatmapDataUrl: string;
  isMockPrediction: true; // Explicitly flag demo predictions
}

export interface ScanItem {
  id: string;
  timestamp: string;
  cropId: CropId;
  cropName: string;
  diseaseName: string;
  scientificName: string;
  severity: SeverityLevel;
  confidence: number;
  imageUrl: string;
  summary: string;
  recommendationSnippet: string;
  yoloBoundingBox?: BoundingBox;
  limeFeatures?: LimeFeature[];
  fullResult?: FullAnalysisResult;
}

export interface QuickSampleLeaf {
  id: string;
  cropId: CropId;
  title: string;
  diseaseName: string;
  imageUrl: string;
  description: string;
}
