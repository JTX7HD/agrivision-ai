/**
 * AgriVision AI - Correction Learning Types
 */

export interface LeafCorrectionRecord {
  id: string;
  createdAt: string;
  imageUrl: string;
  originalImageHash: string;
  correctedClassIndex: number;
  correctedClassName: string;
  predictedClassIndex: number;
  predictedClassName: string;
  confidence: number;
  modelVersion: string;
  modelCheckpoint: string;
  cropId: string;
  yoloBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  };
  notes?: string;
  status: 'approved' | 'pending' | 'rejected' | 'trained';
  trainedAt?: string;
  trainedInModelVersion?: string;
}

export interface SaveCorrectionPayload {
  imageDataUrl: string;
  correctedClassIndex: number;
  correctedClassName: string;
  predictedClassIndex: number;
  predictedClassName: string;
  confidence: number;
  modelVersion?: string;
  modelCheckpoint?: string;
  cropId?: string;
  yoloBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence?: number;
  };
  notes?: string;
}

export interface CorrectionStatsResponse {
  total: number;
  approvedCount: number;
  untrainedCount: number;
  classBreakdown: Record<string, number>;
  latestCorrections: LeafCorrectionRecord[];
  activeModelVersion: string;
  baselineAccuracyPV: number;
  baselineAccuracyPlantDoc: number;
}

export interface CandidateEvaluationResult {
  candidateVersion: string;
  checkpointName: string;
  pvAccuracy: number;
  plantdocAccuracy: number;
  validationLoss: number;
  passedValidation: boolean;
  regressionDetected: boolean;
  regressionDetails?: string;
  candidateOnnxUrl?: string;
  evaluatedAt: string;
}
