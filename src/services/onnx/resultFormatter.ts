import type { DiseaseKnowledge, ConfidenceLevel, ClassProbability } from '../../models/types';
import { TOMATO_DISEASE_CLASSES, mapClassIndexToDisease } from './classMapper';

export interface FormattedONNXResult {
  predictedClassIndex: number;
  predictedClassName: string;
  disease: DiseaseKnowledge;
  topConfidence: number; // Percentage 0 - 100
  confidenceLevel: ConfidenceLevel;
  confidenceLabel: string;
  classProbabilities: ClassProbability[];
  rawLogits: number[];
  modelName: string;
  inferenceTimeMs: number;
  isMockPrediction: false;
}

export function formatInferenceResult(
  probabilities: number[],
  rawLogitsArray: number[],
  inferenceTimeMs: number
): FormattedONNXResult {
  // Find highest probability class index from real model output probabilities
  let maxProb = -1;
  let topIndex = 0;

  probabilities.forEach((prob, idx) => {
    if (prob > maxProb) {
      maxProb = prob;
      topIndex = idx;
    }
  });

  const topConfidence = Math.round(maxProb * 1000) / 10; // e.g. 87.4%
  const topEntry = TOMATO_DISEASE_CLASSES.find((c) => c.index === topIndex) || TOMATO_DISEASE_CLASSES[0];
  const diseaseInfo = mapClassIndexToDisease(topIndex);

  // Confidence Threshold Determination (Section 9)
  let confidenceLevel: ConfidenceLevel = 'High';
  let confidenceLabel = 'High-confidence model prediction';

  if (topConfidence >= 80.0) {
    confidenceLevel = 'High';
    confidenceLabel = 'High-confidence model prediction';
  } else if (topConfidence >= 60.0) {
    confidenceLevel = 'Moderate';
    confidenceLabel = 'Moderate-confidence model prediction';
  } else {
    confidenceLevel = 'Low';
    confidenceLabel = 'Low-confidence prediction — retake the image or seek expert confirmation.';
  }

  const classProbabilities: ClassProbability[] = TOMATO_DISEASE_CLASSES.map((entry) => {
    const prob = probabilities[entry.index] || 0;
    return {
      classIndex: entry.index,
      className: entry.className,
      displayName: entry.displayName,
      probability: Math.round(prob * 1000) / 10
    };
  }).sort((a, b) => b.probability - a.probability);

  return {
    predictedClassIndex: topIndex,
    predictedClassName: topEntry.className,
    disease: diseaseInfo,
    topConfidence,
    confidenceLevel,
    confidenceLabel,
    classProbabilities,
    rawLogits: rawLogitsArray,
    modelName: 'MobileNetV3 (public/models/tomato_disease_mobilenetv3.onnx)',
    inferenceTimeMs,
    isMockPrediction: false
  };
}
