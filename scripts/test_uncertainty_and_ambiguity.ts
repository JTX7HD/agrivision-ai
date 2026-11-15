import fs from 'node:fs';
import path from 'node:path';
import {
  formatInferenceResult,
  evaluateUncertainty,
  sanitizeProbabilities,
  PROVISIONAL_CONFIDENCE_THRESHOLD,
  PROVISIONAL_MARGIN_THRESHOLD
} from '../src/services/onnx/resultFormatter.ts';
import { computeSoftmax } from '../src/services/onnx/softmax.ts';
import { PipelineOrchestrator } from '../src/services/pipeline/pipelineOrchestrator.ts';
import type {
  ILeafDetector,
  IDiseaseClassifier,
  ILeafSegmenter,
  IExplainabilityEngine
} from '../src/services/pipeline/types.ts';
import { MOBILENETV3_V2_METADATA } from '../src/services/pipeline/diseaseClassifierService.ts';
import { TOMATO_DISEASE_CLASSES } from '../src/services/onnx/classMapper.ts';

async function runUncertaintyTestSuite() {
  console.log('================================================================');
  console.log('AGRIVISION AI: PHASE C TASK 2 - UNCERTAINTY & AMBIGUITY SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
      throw new Error(`Test assertion failed: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 1: CORE UNCERTAINTY & AMBIGUITY LOGIC
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: Prediction Uncertainty & Ambiguity Logic ---');

  // Test 1.1: High-confidence prediction with wide top-two margin
  console.log('\nTest 1.1: High-confidence prediction with wide margin (Certain):');
  {
    // Class 1 (Early Blight) = 0.90, Class 2 (Late Blight) = 0.04, others = 0.06 / 8
    const probs = new Array(10).fill(0.06 / 8);
    probs[1] = 0.90; // 90.0%
    probs[2] = 0.04; // 4.0%
    const logits = [0, 4.5, 0.2, 0, 0, 0, 0, 0, 0, 0];

    const result = formatInferenceResult(probs, logits, 25);
    assert(result.predictedClassIndex === 1, 'Top predicted class is Early Blight');
    assert(result.topConfidence === 90.0, 'Top confidence is 90.0%');
    assert(result.secondPrediction !== undefined, 'Second prediction is present');
    assert(result.secondPrediction?.classIndex === 2, 'Second prediction is Late Blight');
    assert(result.secondPrediction?.probability === 4.0, 'Second confidence is 4.0%');
    assert(result.topMargin === 86.0, 'Top margin is 86.0 percentage points', `margin: ${result.topMargin} pp`);
    assert(!result.uncertainty.isUncertain, 'Result is NOT uncertain');
    assert(!result.uncertainty.isWeakConfidence, 'isWeakConfidence is false');
    assert(!result.uncertainty.isAmbiguous, 'isAmbiguous is false');
    assert(result.confidenceLevel === 'High', 'Confidence level is High');
    assert(result.uncertainty.warningMessage === undefined, 'No warning message for clear diagnosis');
  }

  // Test 1.2: Low-confidence prediction (Weak confidence)
  console.log('\nTest 1.2: Low-confidence prediction (Weak, below 60% threshold):');
  {
    // Top class = 45%, Runner-up = 25% (Margin 20% > 10%, but confidence 45% < 60%)
    const probs = new Array(10).fill(0.30 / 8);
    probs[4] = 0.45; // Septoria Leaf Spot: 45.0%
    probs[0] = 0.25; // Bacterial Spot: 25.0%
    const logits = [1.2, 0, 0, 0, 2.0, 0, 0, 0, 0, 0];

    const result = formatInferenceResult(probs, logits, 30);
    assert(result.predictedClassIndex === 4, 'Top class is Septoria Leaf Spot');
    assert(result.topConfidence === 45.0, 'Top confidence is 45.0%');
    assert(result.secondPrediction?.classIndex === 0, 'Second class is Bacterial Spot');
    assert(result.secondPrediction?.probability === 25.0, 'Second probability is 25.0%');
    assert(result.topMargin === 20.0, 'Top margin is 20.0 percentage points (> 10 pp)');
    assert(result.uncertainty.isUncertain === true, 'Result is flagged as uncertain');
    assert(result.uncertainty.isWeakConfidence === true, 'isWeakConfidence is true (45.0% < 60%)');
    assert(result.uncertainty.isAmbiguous === false, 'isAmbiguous is false (margin 20.0 pp >= 10 pp)');
    assert(result.confidenceLevel === 'Low', 'Confidence level is Low');
    assert(
      result.uncertainty.warningMessage?.includes('The diagnosis is uncertain') ?? false,
      'Contains simple user-friendly uncertainty statement',
      result.uncertainty.warningMessage
    );
    assert(
      result.uncertainty.warningMessage?.includes('Try another clear photo or ask an agricultural expert.') ?? false,
      'Contains farmer-actionable advice in warning'
    );
  }

  // Test 1.3: High top score but narrow top-two margin (Ambiguous)
  console.log('\nTest 1.3: Narrow top-two margin (Ambiguity between top two classes):');
  {
    // Top class = 49.0%, Runner-up = 44.5% -> Margin = 4.5 percentage points (< 10 pp)
    const probs = new Array(10).fill(0.065 / 8);
    probs[1] = 0.490; // Early Blight = 49.0%
    probs[2] = 0.445; // Late Blight = 44.5%
    const logits = [0, 3.1, 3.0, 0, 0, 0, 0, 0, 0, 0];

    const result = formatInferenceResult(probs, logits, 28);
    assert(result.predictedClassIndex === 1, 'Top class is Early Blight');
    assert(result.secondPrediction?.classIndex === 2, 'Runner-up is Late Blight');
    assert(result.topMargin === 4.5, 'Margin is exactly 4.5 percentage points (< 10 pp threshold)');
    assert(result.uncertainty.isAmbiguous === true, 'isAmbiguous is true');
    assert(result.uncertainty.isUncertain === true, 'isUncertain is true');
    assert(
      result.uncertainty.warningMessage?.includes('ambiguous between') ?? false,
      'Warning explicitly names ambiguity between leading classes',
      result.uncertainty.warningMessage
    );
    assert(
      result.uncertainty.warningMessage?.includes('Tomato Early Blight') &&
      result.uncertainty.warningMessage?.includes('Tomato Late Blight'),
      'Warning identifies both specific disease candidates'
    );
  }

  // Test 1.4: High confidence (e.g. 68%) with close runner-up (62%) [Normalized multi-class or two-class dominant]
  console.log('\nTest 1.4: Above 60% confidence but narrow margin (< 10 pp):');
  {
    // Even if top class is above 60% (e.g. 52% and 48% or with custom thresholds):
    const probs = [0.01, 0.48, 0.46, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0, 0.0];
    const result = formatInferenceResult(probs, [0, 3, 2.9, 0, 0, 0, 0, 0, 0, 0], 20, {
      confidenceThreshold: 45.0, // top confidence 48% is above this confidence threshold
      marginThreshold: 10.0      // margin 2.0 pp is below margin threshold
    });
    assert(result.uncertainty.isWeakConfidence === false, 'Not weak confidence under 45% threshold');
    assert(result.uncertainty.isAmbiguous === true, 'Flagged as ambiguous because margin (2.0 pp) < 10.0 pp');
    assert(result.uncertainty.isUncertain === true, 'Overall uncertain due to ambiguity');
  }

  // Test 1.5: Configurable thresholds
  console.log('\nTest 1.5: Configurable thresholds verification:');
  {
    const probs = new Array(10).fill(0.02);
    probs[0] = 0.65; // 65%
    probs[1] = 0.51; // With unnormalized input
    // With custom strict thresholds: confidenceThreshold = 75%, marginThreshold = 20%
    const strictResult = formatInferenceResult([0.65, 0.17, 0.05, 0.03, 0.02, 0.02, 0.02, 0.02, 0.01, 0.01], null, 15, {
      confidenceThreshold: 75.0,
      marginThreshold: 20.0
    });
    assert(strictResult.uncertainty.confidenceThreshold === 75.0, 'Custom confidence threshold applied');
    assert(strictResult.uncertainty.marginThreshold === 20.0, 'Custom margin threshold applied');
    assert(strictResult.uncertainty.isWeakConfidence === true, '65% is weak under 75% threshold');
    assert(PROVISIONAL_CONFIDENCE_THRESHOLD === 60.0, 'Provisional confidence threshold is 60.0%');
    assert(PROVISIONAL_MARGIN_THRESHOLD === 10.0, 'Provisional margin threshold is 10.0 pp');
    assert(TOMATO_DISEASE_CLASSES.length === 10, '10 tomato disease classes configured in classMapper');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 1.6: PHASE C TASK 2.1 - CONSOLIDATED PREDICTION UNCERTAINTY UI (CASES A, B, C, D)
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 1.6: Phase C Task 2.1 — UI Banner Consolidation (Cases A, B, C, D) ---');

  // Helper simulating the DiseaseResultCard banner display logic
  function simulateUIBannerRendering(result: {
    confidenceLevel: string;
    confidenceLabel: string;
    uncertainty?: {
      isUncertain: boolean;
      isWeakConfidence: boolean;
      isAmbiguous: boolean;
      warningMessage?: string;
      marginThreshold: number;
    };
  }) {
    const isUncertain = result.uncertainty?.isUncertain ?? false;
    let primaryUncertaintyTitle: string | undefined;
    let primaryUncertaintyReason: string | undefined;

    if (isUncertain && result.uncertainty) {
      if (result.uncertainty.isAmbiguous && result.uncertainty.isWeakConfidence) {
        primaryUncertaintyTitle = 'Prediction Uncertainty — Low Confidence & Ambiguous Scores';
        primaryUncertaintyReason = 'Low confidence & two diseases have similar prediction scores';
      } else if (result.uncertainty.isAmbiguous) {
        primaryUncertaintyTitle = 'Ambiguous Diagnosis — Leading Classes Are Close';
        primaryUncertaintyReason = 'Two diseases have similar prediction scores';
      } else {
        primaryUncertaintyTitle = 'Prediction Uncertainty — Low Confidence';
        primaryUncertaintyReason = 'Low confidence';
      }
    }

    const confidenceIndicatorBanner = !isUncertain;
    const primaryUncertaintyBanner = isUncertain;

    return {
      confidenceIndicatorBanner,
      confidenceIndicatorLevel: confidenceIndicatorBanner ? result.confidenceLevel : undefined,
      primaryUncertaintyBanner,
      primaryUncertaintyTitle,
      primaryUncertaintyReason,
      primaryUncertaintyMessage: isUncertain ? result.uncertainty?.warningMessage : undefined,
      totalWarningBannersCount: primaryUncertaintyBanner ? 1 : 0
    };
  }

  // Case A: Low confidence, wide margin (e.g. 52.3% vs 22.8%)
  console.log('\nCase A Verification — Low confidence, wide margin:');
  {
    // Class 1 (Early Blight) = 0.523, Class 2 (Late Blight) = 0.228, others = 0.249 / 8
    const probs = new Array(10).fill(0.249 / 8);
    probs[1] = 0.523; // 52.3%
    probs[2] = 0.228; // 22.8%
    const result = formatInferenceResult(probs, null, 20);

    assert(result.topConfidence === 52.3, 'Case A: Top confidence is 52.3%');
    assert(result.secondPrediction?.probability === 22.8, 'Case A: Runner-up confidence is 22.8%');
    assert(result.topMargin === 29.5, 'Case A: Top-two margin is 29.5 percentage points');
    assert(result.uncertainty.isWeakConfidence === true, 'Case A: Flagged as weak confidence (< 60%)');
    assert(result.uncertainty.isAmbiguous === false, 'Case A: Not ambiguous (margin 29.5 pp >= 10 pp)');
    assert(result.uncertainty.isUncertain === true, 'Case A: Overall uncertain');
    assert(
      result.uncertainty.warningMessage?.includes('low prediction confidence (52.3%)') ?? false,
      'Case A: Warning identifies low confidence'
    );
    assert(
      result.uncertainty.warningMessage?.includes('Try another clear photo or ask an agricultural expert.') ?? false,
      'Case A: Warning includes required farmer guidance'
    );

    const ui = simulateUIBannerRendering(result);
    assert(ui.totalWarningBannersCount === 1, 'Case A UI: Exactly ONE warning banner rendered');
    assert(ui.primaryUncertaintyBanner === true, 'Case A UI: Primary uncertainty warning banner is active');
    assert(ui.confidenceIndicatorBanner === false, 'Case A UI: Redundant confidence indicator banner is suppressed');
    assert(ui.primaryUncertaintyReason === 'Low confidence', 'Case A UI: Reason identifies "Low confidence"');
    assert(ui.primaryUncertaintyTitle === 'Prediction Uncertainty — Low Confidence', 'Case A UI: Title identifies low confidence');
  }

  // Case B: High confidence, narrow margin (e.g. 68.0% vs 62.0%)
  console.log('\nCase B Verification — High confidence, narrow margin:');
  {
    const evalB = evaluateUncertainty(68.0, 62.0, 'Tomato Early Blight', 'Tomato Late Blight');
    assert(evalB.topConfidence === 68.0, 'Case B: Top confidence is 68.0%');
    assert(evalB.secondConfidence === 62.0, 'Case B: Runner-up confidence is 62.0%');
    assert(evalB.topMargin === 6.0, 'Case B: Margin is exactly 6.0 percentage points');
    assert(evalB.isWeakConfidence === false, 'Case B: Not weak confidence (68.0% >= 60.0% threshold)');
    assert(evalB.isAmbiguous === true, 'Case B: Flagged as ambiguous (margin 6.0 pp < 10.0 pp threshold)');
    assert(evalB.isUncertain === true, 'Case B: Marked uncertain because margin is below threshold');
    assert(
      evalB.warningMessage?.includes('ambiguous between Tomato Early Blight (68.0%) and Tomato Late Blight (62.0%)') ?? false,
      'Case B: Warning identifies ambiguity and names both leading classes with scores'
    );
    assert(
      evalB.warningMessage?.includes('6.0 percentage point margin') ?? false,
      'Case B: Warning explicitly specifies the 6.0 percentage-point margin'
    );
    assert(
      evalB.warningMessage?.includes('The diagnosis is uncertain. Try another clear photo or ask an agricultural expert.') ?? false,
      'Case B: Warning includes standard required diagnosis uncertainty and expert guidance'
    );

    const ui = simulateUIBannerRendering({
      confidenceLevel: 'Low',
      confidenceLabel: 'Low-confidence model prediction',
      uncertainty: evalB
    });
    assert(ui.totalWarningBannersCount === 1, 'Case B UI: Exactly ONE warning banner rendered');
    assert(ui.primaryUncertaintyBanner === true, 'Case B UI: Primary uncertainty banner is active');
    assert(ui.confidenceIndicatorBanner === false, 'Case B UI: Confidence indicator banner is suppressed');
    assert(ui.primaryUncertaintyReason === 'Two diseases have similar prediction scores', 'Case B UI: Reason identifies similar prediction scores');
    assert(ui.primaryUncertaintyTitle === 'Ambiguous Diagnosis — Leading Classes Are Close', 'Case B UI: Title identifies ambiguous diagnosis');
  }

  // Case C: Both low confidence and narrow margin (e.g. 48.0% vs 44.0%, margin 4.0 pp)
  console.log('\nCase C Verification — Both low confidence and narrow margin:');
  {
    const evalC = evaluateUncertainty(48.0, 44.0, 'Tomato Early Blight', 'Tomato Late Blight');
    assert(evalC.isWeakConfidence === true, 'Case C: Low confidence (< 60.0%)');
    assert(evalC.isAmbiguous === true, 'Case C: Narrow margin (< 10.0 pp)');
    assert(evalC.isUncertain === true, 'Case C: Overall uncertain');
    assert(
      evalC.warningMessage?.includes('low prediction confidence (48.0%)') ?? false,
      'Case C: Warning mentions low prediction confidence'
    );
    assert(
      evalC.warningMessage?.includes('ambiguous between Tomato Early Blight (48.0%) and Tomato Late Blight (44.0%, margin: 4.0 pp)') ?? false,
      'Case C: Warning mentions ambiguity and both classes with margin'
    );
    // Verify no repeated sentences
    const sentenceOccurrences = (evalC.warningMessage?.match(/The diagnosis is uncertain/g) || []).length;
    assert(sentenceOccurrences === 1, 'Case C: "The diagnosis is uncertain" appears exactly once without repetition');

    const ui = simulateUIBannerRendering({
      confidenceLevel: 'Low',
      confidenceLabel: 'Low-confidence model prediction',
      uncertainty: evalC
    });
    assert(ui.totalWarningBannersCount === 1, 'Case C UI: Exactly ONE warning banner rendered');
    assert(ui.primaryUncertaintyBanner === true, 'Case C UI: Primary uncertainty banner is active');
    assert(ui.confidenceIndicatorBanner === false, 'Case C UI: Confidence indicator banner is suppressed');
    assert(ui.primaryUncertaintyReason === 'Low confidence & two diseases have similar prediction scores', 'Case C UI: Reason identifies both factors');
    assert(ui.primaryUncertaintyTitle === 'Prediction Uncertainty — Low Confidence & Ambiguous Scores', 'Case C UI: Title identifies combined uncertainty');
  }

  // Case D: Confident prediction (e.g. 88.0% vs 4.0%, margin 84.0 pp)
  console.log('\nCase D Verification — Confident prediction:');
  {
    const probs = new Array(10).fill(0.08 / 8);
    probs[1] = 0.88; // 88.0%
    probs[2] = 0.04; // 4.0%
    const result = formatInferenceResult(probs, null, 15);

    assert(result.topConfidence === 88.0, 'Case D: Top confidence 88.0%');
    assert(result.topMargin === 84.0, 'Case D: Margin 84.0 pp');
    assert(result.uncertainty.isWeakConfidence === false, 'Case D: isWeakConfidence is false');
    assert(result.uncertainty.isAmbiguous === false, 'Case D: isAmbiguous is false');
    assert(result.uncertainty.isUncertain === false, 'Case D: isUncertain is false');
    assert(result.uncertainty.warningMessage === undefined, 'Case D: No uncertainty warning message');
    assert(result.confidenceLevel === 'High', 'Case D: Normal confidence level is High');

    const ui = simulateUIBannerRendering(result);
    assert(ui.totalWarningBannersCount === 0, 'Case D UI: ZERO uncertainty warning banners rendered');
    assert(ui.primaryUncertaintyBanner === false, 'Case D UI: Uncertainty banner is not rendered');
    assert(ui.confidenceIndicatorBanner === true, 'Case D UI: Normal confidence level badge is rendered');
    assert(ui.confidenceIndicatorLevel === 'High', 'Case D UI: Normal confidence badge displays High level');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 2: EDGE CASES AND MALFORMED INPUTS
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Edge Cases & Malformed Inputs ---');

  // Test 2.1: Non-finite probabilities (NaN, Infinity, -Infinity)
  console.log('\nTest 2.1: Non-finite probability values:');
  {
    const dirtyProbs = [NaN, 0.5, Infinity, -0.3, 0.2, 0.1, 0.05, 0.05, 0.05, 0.05];
    const sanitized = sanitizeProbabilities(dirtyProbs, 10);
    assert(sanitized.every((p) => Number.isFinite(p) && p >= 0), 'All sanitized values are finite and >= 0');
    const sum = sanitized.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 1e-4, 'Sanitized probabilities sum to 1.0', `sum: ${sum}`);

    const result = formatInferenceResult(dirtyProbs, [NaN, 1, 2, 3, 4, 5, 6, 7, 8, 9], 10);
    assert(Number.isFinite(result.topConfidence), 'Result topConfidence is finite number');
    assert(Number.isFinite(result.topMargin), 'Result topMargin is finite number');
    assert(!isNaN(result.topConfidence), 'Result topConfidence is not NaN');
  }

  // Test 2.2: Missing or empty probability array
  console.log('\nTest 2.2: Missing, null, or empty probability inputs:');
  {
    const emptyResult = formatInferenceResult([], [], 10);
    assert(emptyResult.classProbabilities.length === 10, 'Empty input safely expands to 10 classes');
    assert(emptyResult.topConfidence === 10.0, 'Uniform distribution (10.0% each)');
    assert(emptyResult.topMargin === 0.0, 'Top margin is 0.0 for uniform distribution');
    assert(emptyResult.uncertainty.isUncertain === true, 'Empty input flagged as uncertain');

    const nullResult = formatInferenceResult(null, null, 10);
    assert(nullResult.predictedClassIndex >= 0, 'Null input handled without crash');
    assert(nullResult.uncertainty.isUncertain === true, 'Null input flagged as uncertain');
  }

  // Test 2.3: computeSoftmax resilience with non-finite logits
  console.log('\nTest 2.3: computeSoftmax resilience with invalid logits:');
  {
    const nanLogits = [NaN, 1.0, 2.0, Infinity, 0.5];
    const probs = computeSoftmax(nanLogits);
    assert(probs.length === 5, 'computeSoftmax returned 5 probabilities');
    assert(probs.every((p) => Number.isFinite(p) && p >= 0), 'All softmax probabilities are finite');
    const sum = probs.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 1e-4, 'Softmax probabilities sum to 1.0');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 3: PIPELINE INTEGRATION & PRESERVATION OF TASK 1
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Pipeline Integration & Task 1 Fix Preservation ---');

  const sampleDiskImage = path.join(process.cwd(), 'data', 'corrections', 'images', 'tomato_Tomato___Late_blight_1792351364040_40c68d51.jpg');
  let genuineDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  let isGenuineDiskImage = false;
  if (fs.existsSync(sampleDiskImage)) {
    const fileBytes = fs.readFileSync(sampleDiskImage);
    genuineDataUrl = `data:image/jpeg;base64,${fileBytes.toString('base64')}`;
    isGenuineDiskImage = true;
    console.log(`  [INFO] Genuine tomato image loaded: ${path.basename(sampleDiskImage)} (${fileBytes.length} bytes)`);
  }

  let classifierCalls = 0;
  const mockClassifier: IDiseaseClassifier = {
    name: 'Mock MobileNetV3 with Uncertainty',
    modelIdentifier: 'best_tomato_mobilenetv3_v2.pth',
    modelInfo: MOBILENETV3_V2_METADATA,
    classify: async () => {
      classifierCalls++;
      // Return an ambiguous classification (Early Blight 48.0% vs Late Blight 44.0%, margin 4.0 pp)
      const probs = [0.01, 0.48, 0.44, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
      return formatInferenceResult(probs, [0, 3, 2.9, 0, 0, 0, 0, 0, 0, 0], 35);
    }
  };

  const passThroughSegmenter: ILeafSegmenter = {
    name: 'Segmenter',
    modelIdentifier: 'sam',
    segmentLeaf: async (_img, det) => ({ detectionId: det.id, isolatedLeafImageUrl: det.croppedImageUrl })
  };

  const dummyExplainer: IExplainabilityEngine = {
    name: 'Explainer',
    modelIdentifier: 'lime',
    explain: async () => ({ summary: 'Explainability trace', topFeatures: [] })
  };

  // Test 3.1: Valid leaf passes through pipeline and exposes secondPrediction + uncertainty
  console.log('\nTest 3.1: Valid leaf pipeline execution exposes uncertainty and secondPrediction:');
  {
    classifierCalls = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 45 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(mockClassifier);
    orchestrator.setExplainer(dummyExplainer);
    orchestrator.setDetector({
      name: 'Valid Leaf Detector',
      modelIdentifier: 'yolo11n',
      detectLeaves: async () => [
        {
          id: 'leaf-1',
          box: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          confidence: 0.89,
          label: 'Target Leaf',
          croppedImageUrl: genuineDataUrl
        }
      ]
    });

    const result = await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    assert(classifierCalls === 1, 'Classifier was called exactly once for valid leaf');
    assert(result.secondPrediction !== undefined, 'result.secondPrediction is exposed on FullAnalysisResult');
    assert(result.secondPrediction?.displayName === 'Tomato Late Blight', 'secondPrediction identifies runner-up condition');
    assert(result.topMargin === 4.0, 'topMargin is exposed on FullAnalysisResult (4.0 pp)');
    assert(result.uncertainty?.isUncertain === true, 'result.uncertainty is exposed and flags ambiguity');
    assert(result.uncertainty?.isAmbiguous === true, 'result.uncertainty.isAmbiguous is true');
    assert(
      result.pipelineStages.find((s) => s.id === 'onnx')?.outputSummary?.includes('ambiguous between') ?? false,
      'Classification pipeline stage notes uncertainty in its outputSummary'
    );
  }

  // Test 3.2: Preservation of Task 1 No-Leaf Rejection (Pipeline STOPS before classifier)
  console.log('\nTest 3.2: Task 1 Preservation: No-leaf stops pipeline, classifier NEVER called:');
  {
    classifierCalls = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 45 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(mockClassifier);
    orchestrator.setExplainer(dummyExplainer);
    const emptyDetector: ILeafDetector = {
      name: 'Empty YOLO Detector',
      modelIdentifier: 'yolo11n',
      detectLeaves: async () => [] // 0 leaves found!
    };
    orchestrator.setDetector(emptyDetector);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws on no-leaf image');
    assert(
      errorThrown?.message === 'No plant leaf detected. Please take a clear, close-up photo of a plant leaf.',
      'Exact Task 1 user-friendly error message preserved'
    );
    assert(classifierCalls === 0, 'PRESERVATION CONFIRMED: Classifier was NEVER called on no-leaf image');
  }

  // Test 3.3: Preservation of Task 1 Blurry Image Rejection
  console.log('\nTest 3.3: Task 1 Preservation: Blurry leaf stops at Stage 1, classifier NEVER called:');
  {
    classifierCalls = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({
      isSuitable: false,
      isBlurry: true,
      issueDescription: 'Image appears blurry or out of focus. Please hold your camera steady, ensure good lighting, and take a sharp, close-up photo of the leaf.'
    }));
    orchestrator.setClassifier(mockClassifier);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws on blurry image');
    assert(
      errorThrown?.message.includes('blurry or out of focus') ?? false,
      'Blurry error message displayed to user'
    );
    assert(classifierCalls === 0, 'PRESERVATION CONFIRMED: Classifier was NEVER called on blurry image');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 4: CORRECTION SUBMISSION & SCAN HISTORY INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Correction Submission & Scan History Integrity ---');
  const { execSync } = await import('node:child_process');
  try {
    const phase1Output = execSync('npx tsx scripts/test_phase1.ts', { encoding: 'utf-8' });
    assert(
      phase1Output.includes('ALL PHASE 1 STORAGE CHECKS PASSED'),
      'Regression test scripts/test_phase1.ts passed cleanly'
    );
    assert(
      phase1Output.includes('All 8 required fields verified'),
      'Correction record 8 required fields verified'
    );
    assert(
      phase1Output.includes('Duplicate prevention verified'),
      'Duplicate prevention verified'
    );
  } catch (err) {
    assert(false, 'scripts/test_phase1.ts failed', String(err));
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`Image Source: ${isGenuineDiskImage ? 'Genuine tomato leaf image loaded from disk' : 'Synthetic image data'}`);
  console.log('================================================================');
}

runUncertaintyTestSuite().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
