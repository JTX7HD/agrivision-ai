import type {
  DiseaseKnowledge,
  ConfidenceLevel,
  ClassProbability,
  SecondClassPrediction,
  UncertaintyEvaluation
} from '../../models/types';
import { TOMATO_DISEASE_CLASSES, mapClassIndexToDisease, type ClassMappingEntry } from './classMapper';

/**
 * Provisional Uncertainty Thresholds Documentation:
 * The default thresholds of 60.0% minimum top confidence and 10.0 percentage-point top-two margin
 * are provisional heuristics established as initial operational decision boundaries.
 * They are not claimed to be scientifically calibrated or clinically validated benchmarks.
 * In a closed-set 10-class Softmax classifier, probability outputs represent a relative distribution
 * across trained classes rather than calibrated empirical certainty, and closed-set models can assign
 * unfamiliar or out-of-distribution inputs to known classes with arbitrary confidence.
 */
export const PROVISIONAL_CONFIDENCE_THRESHOLD = 60.0;
export const PROVISIONAL_MARGIN_THRESHOLD = 10.0;

export interface ResultFormatterOptions {
  /** Minimum top confidence threshold in percentage points (0-100). Default: 60.0 (provisional). */
  confidenceThreshold?: number;
  /** Minimum margin between top two classes in percentage points (0-100). Default: 10.0 (provisional). */
  marginThreshold?: number;
  /** Optional custom model name string. */
  modelName?: string;
  /** Optional class mapping entries (defaults to TOMATO_DISEASE_CLASSES). */
  supportedClasses?: ClassMappingEntry[];
  /** Optional custom disease mapper function. */
  mapClassIndexToDisease?: (classIndex: number) => DiseaseKnowledge;
}

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
  secondPrediction?: SecondClassPrediction;
  topMargin: number;
  uncertainty: UncertaintyEvaluation;
}

/**
 * Sanitizes and normalizes an array of raw probability values.
 * Handles non-finite values (NaN, Infinity), negative numbers, and empty arrays safely.
 */
export function sanitizeProbabilities(
  rawProbs: ArrayLike<number> | null | undefined,
  expectedLength = 10
): number[] {
  if (!rawProbs || typeof rawProbs !== 'object' || rawProbs.length === 0) {
    const uniform = 1 / expectedLength;
    return new Array(expectedLength).fill(uniform);
  }

  const length = Math.max(expectedLength, rawProbs.length);
  const sanitized: number[] = [];
  let sum = 0;
  let hasValid = false;

  for (let i = 0; i < length; i++) {
    const val = rawProbs[i];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      sanitized.push(val);
      sum += val;
      if (val > 0) hasValid = true;
    } else {
      sanitized.push(0);
    }
  }

  if (!hasValid || sum <= 0) {
    const uniform = 1 / length;
    return new Array(length).fill(uniform);
  }

  return sanitized.map((v) => v / sum);
}

/**
 * Pure function evaluating uncertainty and ambiguity between top prediction and runner-up class.
 */
export function evaluateUncertainty(
  topConfidence: number,
  secondConfidence: number,
  topClassName?: string,
  secondClassName?: string,
  options?: ResultFormatterOptions
): UncertaintyEvaluation {
  const confidenceThreshold = options?.confidenceThreshold ?? PROVISIONAL_CONFIDENCE_THRESHOLD;
  const marginThreshold = options?.marginThreshold ?? PROVISIONAL_MARGIN_THRESHOLD;

  const topMargin = Math.round(Math.max(0, topConfidence - secondConfidence) * 10) / 10;
  const isWeakConfidence = topConfidence < confidenceThreshold;
  const isAmbiguous = topMargin < marginThreshold;
  const isUncertain = isWeakConfidence || isAmbiguous;

  const reasons: string[] = [];
  if (isWeakConfidence) {
    reasons.push(
      `Low prediction confidence (${topConfidence.toFixed(1)}% < ${confidenceThreshold.toFixed(1)}% threshold)`
    );
  }
  if (isAmbiguous) {
    reasons.push(
      `Two diseases have similar prediction scores (Margin: ${topMargin.toFixed(1)} pp < ${marginThreshold.toFixed(1)} pp threshold)`
    );
  }

  let warningMessage: string | undefined;
  if (isUncertain) {
    if (isWeakConfidence && isAmbiguous) {
      if (secondClassName && topClassName) {
        warningMessage = `The diagnosis is uncertain due to low prediction confidence (${topConfidence.toFixed(1)}%), and ambiguous between ${topClassName} (${topConfidence.toFixed(1)}%) and ${secondClassName} (${secondConfidence.toFixed(1)}%, margin: ${topMargin.toFixed(1)} pp). Try another clear photo or ask an agricultural expert.`;
      } else {
        warningMessage = `The diagnosis is uncertain due to low prediction confidence (${topConfidence.toFixed(1)}%) and narrow separation margin (${topMargin.toFixed(1)} pp). Try another clear photo or ask an agricultural expert.`;
      }
    } else if (isAmbiguous) {
      if (secondClassName && topClassName) {
        warningMessage = `The diagnosis is ambiguous between ${topClassName} (${topConfidence.toFixed(1)}%) and ${secondClassName} (${secondConfidence.toFixed(1)}%) with only a ${topMargin.toFixed(1)} percentage point margin. The diagnosis is uncertain. Try another clear photo or ask an agricultural expert.`;
      } else {
        warningMessage = `The diagnosis is ambiguous between the top two conditions (margin: ${topMargin.toFixed(1)} pp). The diagnosis is uncertain. Try another clear photo or ask an agricultural expert.`;
      }
    } else if (isWeakConfidence) {
      warningMessage = `The diagnosis is uncertain due to low prediction confidence (${topConfidence.toFixed(1)}%). Try another clear photo or ask an agricultural expert.`;
    } else {
      warningMessage = 'The diagnosis is uncertain. Try another clear photo or ask an agricultural expert.';
    }
  }

  return {
    isUncertain,
    isWeakConfidence,
    isAmbiguous,
    topConfidence,
    secondConfidence,
    topMargin,
    confidenceThreshold,
    marginThreshold,
    warningMessage,
    reasons
  };
}

export function formatInferenceResult(
  probabilities: ArrayLike<number> | null | undefined,
  rawLogitsArray: ArrayLike<number> | null | undefined,
  inferenceTimeMs: number,
  options?: ResultFormatterOptions
): FormattedONNXResult {
  const classes = options?.supportedClasses ?? TOMATO_DISEASE_CLASSES;
  const safeProbabilities = sanitizeProbabilities(probabilities, classes.length);
  const safeLogits = rawLogitsArray
    ? Array.from(rawLogitsArray).map((v) => (Number.isFinite(v) ? v : 0))
    : new Array(classes.length).fill(0);

  // Build sorted class probabilities
  const classProbabilities: ClassProbability[] = classes.map((entry) => {
    const prob = safeProbabilities[entry.index] ?? 0;
    return {
      classIndex: entry.index,
      className: entry.className,
      displayName: entry.displayName,
      probability: Math.round(prob * 1000) / 10
    };
  }).sort((a, b) => b.probability - a.probability);

  const topEntry = classProbabilities[0] || {
    classIndex: 0,
    className: classes[0].className,
    displayName: classes[0].displayName,
    probability: 0
  };

  const secondEntry = classProbabilities.length > 1 ? classProbabilities[1] : undefined;

  const topConfidence = topEntry.probability;
  const secondConfidence = secondEntry ? secondEntry.probability : 0;
  const topMargin = Math.round(Math.max(0, topConfidence - secondConfidence) * 10) / 10;

  const diseaseResolver = options?.mapClassIndexToDisease ?? mapClassIndexToDisease;
  const topDiseaseInfo = diseaseResolver(topEntry.classIndex);
  const secondDiseaseInfo = secondEntry ? diseaseResolver(secondEntry.classIndex) : undefined;

  // Evaluate uncertainty & ambiguity
  const uncertainty = evaluateUncertainty(
    topConfidence,
    secondConfidence,
    topEntry.displayName,
    secondEntry?.displayName,
    options
  );

  // Confidence Level Determination
  let confidenceLevel: ConfidenceLevel = 'High';
  let confidenceLabel = 'High-confidence model prediction';

  if (topConfidence >= 80.0 && !uncertainty.isAmbiguous) {
    confidenceLevel = 'High';
    confidenceLabel = 'High-confidence model prediction';
  } else if (topConfidence >= 60.0 && !uncertainty.isAmbiguous) {
    confidenceLevel = 'Moderate';
    confidenceLabel = 'Moderate-confidence model prediction';
  } else {
    confidenceLevel = 'Low';
    confidenceLabel = 'Low-confidence model prediction';
  }

  const secondPrediction: SecondClassPrediction | undefined = secondEntry
    ? {
        classIndex: secondEntry.classIndex,
        className: secondEntry.className,
        displayName: secondEntry.displayName,
        probability: secondEntry.probability,
        disease: secondDiseaseInfo
      }
    : undefined;

  return {
    predictedClassIndex: topEntry.classIndex,
    predictedClassName: topEntry.className,
    disease: topDiseaseInfo,
    topConfidence,
    confidenceLevel,
    confidenceLabel,
    classProbabilities,
    rawLogits: safeLogits,
    modelName: options?.modelName || 'MobileNetV3 V2 (public/models/tomato_mobilenetv3_v2.onnx)',
    inferenceTimeMs: Math.max(1, Math.round(inferenceTimeMs)),
    isMockPrediction: false,
    secondPrediction,
    topMargin,
    uncertainty
  };
}
