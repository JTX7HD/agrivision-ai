import type { DiseaseInfo } from '../../models/types';
import { TOMATO_DISEASE_CLASSES, mapClassIndexToDisease } from './classMapper';

export interface FormattedONNXResult {
  disease: DiseaseInfo;
  isHealthy: boolean;
  topConfidence: number; // Percentage 0 - 100
  classBreakdown: {
    index: number;
    className: string;
    displayName: string;
    probabilityPercentage: number;
    isTop: boolean;
  }[];
  inferenceTimeMs: number;
  modelName: string;
  isMockPrediction: false;
}

export function formatInferenceResult(
  probabilities: number[],
  inferenceTimeMs: number
): FormattedONNXResult {
  // Find highest probability class
  let maxProb = -1;
  let topIndex = 0;

  probabilities.forEach((prob, idx) => {
    if (prob > maxProb) {
      maxProb = prob;
      topIndex = idx;
    }
  });

  const topConfidence = Math.round(maxProb * 1000) / 10; // e.g. 96.5%
  const topEntry = TOMATO_DISEASE_CLASSES.find((c) => c.index === topIndex) || TOMATO_DISEASE_CLASSES[0];
  const diseaseInfo = mapClassIndexToDisease(topIndex);

  const formattedDisease: DiseaseInfo = {
    ...diseaseInfo,
    confidence: topConfidence
  };

  const classBreakdown = TOMATO_DISEASE_CLASSES.map((entry) => {
    const prob = probabilities[entry.index] || 0;
    const diseaseObj = mapClassIndexToDisease(entry.index);
    return {
      index: entry.index,
      className: entry.className,
      displayName: diseaseObj.name,
      probabilityPercentage: Math.round(prob * 1000) / 10,
      isTop: entry.index === topIndex
    };
  }).sort((a, b) => b.probabilityPercentage - a.probabilityPercentage);

  return {
    disease: formattedDisease,
    isHealthy: topEntry.isHealthy,
    topConfidence,
    classBreakdown,
    inferenceTimeMs,
    modelName: 'MobileNetV3 (public/models/tomato_disease_mobilenetv3.onnx)',
    isMockPrediction: false
  };
}
