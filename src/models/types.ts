export type CropId = 'tomato' | 'potato' | 'maize' | 'rice' | 'banana' | 'chilli';

export type ConfidenceLevel = 'High' | 'Moderate' | 'Low';

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

export interface DiseaseKnowledge {
  id: string;
  cropId: CropId;
  name: string;
  scientificName: string;
  description: string;
  commonSymptoms: string[];
  generalManagement: string[];
  preventativeMeasures: string[];
}

export interface ImageQualityStatus {
  isSuitable: boolean;
  issueDescription?: string;
  brightness?: number;
  contrast?: number;
  blurScore?: number;
  isBlurry?: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType?: 'normalized' | 'pixel';
}

export interface LeafDetection {
  id: string;
  box: BoundingBox;
  confidence: number;
  label: string;
  croppedImageUrl?: string;
}

export interface LeafSegmentation {
  detectionId: string;
  maskDataUrl?: string;
  isolatedLeafImageUrl?: string;
  polygon?: [number, number][];
  areaRatio?: number;
  iou?: number;
  isRealSAM?: boolean;
  modelIdentifier?: string;
  inferenceTimeMs?: number;
}

export interface LimeFeatureAttribution {
  featureIndex: number;
  importance: number;
  description?: string;
  regionBox?: BoundingBox;
}

export interface LimeExplanation {
  heatmapImageUrl?: string;
  topFeatures?: LimeFeatureAttribution[];
  positiveRegionsUrl?: string;
  negativeRegionsUrl?: string;
  rawWeights?: number[];
  summary?: string;
}

export interface SecondClassPrediction {
  classIndex: number;
  className: string;
  displayName: string;
  probability: number; // percentage 0 - 100
  disease?: DiseaseKnowledge;
}

export interface UncertaintyEvaluation {
  isUncertain: boolean;
  isWeakConfidence: boolean;
  isAmbiguous: boolean;
  topConfidence: number; // percentage 0 - 100
  secondConfidence: number; // percentage 0 - 100
  topMargin: number; // percentage points difference
  confidenceThreshold: number; // provisional threshold
  marginThreshold: number; // provisional threshold
  warningMessage?: string;
  reasons: string[];
}

export interface DetectedLeafAnalysis {
  leafId: string;
  detection: LeafDetection;
  segmentation?: LeafSegmentation;
  classIndex: number;
  className: string;
  confidence: number;
  classProbabilities: ClassProbability[];
  secondPrediction?: SecondClassPrediction;
  topMargin?: number;
  uncertainty?: UncertaintyEvaluation;
  explanation?: LimeExplanation;
}

export interface ClassifierModelInfo {
  modelName: string;
  version: string;
  checkpoint: string;
  plantVillageAccuracy: number;
  plantDocAccuracy: number;
  description: string;
  executionProvider: string;
  inputShape: number[];
  outputShape: number[];
}

export interface PipelineStageStatus {
  id: string;
  name: string;
  modelName: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  durationMs: number;
  outputSummary?: string;
}

export interface ClassProbability {
  classIndex: number;
  className: string;
  displayName: string;
  probability: number; // percentage 0 - 100
}

export interface FullAnalysisResult {
  scanId: string;
  timestamp: string;
  crop: Crop;
  predictedClassIndex: number;
  predictedClassName: string;
  disease: DiseaseKnowledge;
  imageUrl: string;
  pipelineStages: PipelineStageStatus[];
  confidence: number; // Percentage e.g. 87.4%
  confidenceLevel: ConfidenceLevel;
  confidenceLabel: string;
  classProbabilities: ClassProbability[];
  secondPrediction?: SecondClassPrediction;
  topMargin?: number;
  uncertainty?: UncertaintyEvaluation;
  rawLogits: number[];
  imageQuality: ImageQualityStatus;
  isMockPrediction: false;
  detectedLeaves?: DetectedLeafAnalysis[];
  primaryLeaf?: DetectedLeafAnalysis;
  explanation?: LimeExplanation;
  classifierInfo?: ClassifierModelInfo;
  onnxInfo?: {
    modelPath: string;
    modelName: string;
    fileSizeBytes: number;
    inputShape: number[];
    outputShape: number[];
    executionProvider: string;
    inferenceTimeMs: number;
  };
}

export interface ScanItem {
  id: string;
  timestamp: string;
  cropId: CropId;
  cropName: string;
  diseaseName: string;
  scientificName: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  imageUrl: string;
  summary: string;
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

