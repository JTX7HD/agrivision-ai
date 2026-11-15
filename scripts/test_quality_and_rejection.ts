import fs from 'node:fs';
import path from 'node:path';
import {
  computeLaplacianVariance,
  evaluateImageQualityFromPixels,
  PROVISIONAL_BLUR_THRESHOLD
} from '../src/services/onnx/imageQualityCheck.ts';
import { PipelineOrchestrator } from '../src/services/pipeline/pipelineOrchestrator.ts';
import type {
  ILeafDetector,
  IDiseaseClassifier,
  ILeafSegmenter,
  IExplainabilityEngine
} from '../src/services/pipeline/types.ts';
import type {
  LeafDetection,
  LeafSegmentation
} from '../src/models/types.ts';
import { MOBILENETV3_V2_METADATA } from '../src/services/pipeline/diseaseClassifierService.ts';

// Helper to create synthetic RGBA pixel buffers
function createSyntheticRgba(
  width: number,
  height: number,
  generator: (x: number, y: number) => { r: number; g: number; b: number }
): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const { r, g, b } = generator(x, y);
      data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[idx + 3] = 255;
    }
  }
  return data;
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('AGRIVISION AI: PHASE C TASK 1 - QUALITY & REJECTION TEST SUITE');
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
  // TEST SECTION 1: UNIT TESTS FOR BLUR & QUALITY ANALYSIS
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: Image Quality & Blur Detection Tests ---');

  // Case 4: Blank image
  console.log('\nCase 4: Blank image verification:');
  const blankData = createSyntheticRgba(100, 100, () => ({ r: 128, g: 128, b: 128 }));
  const blankResult = evaluateImageQualityFromPixels(blankData, 100, 100);
  assert(!blankResult.isSuitable, 'Blank image rejected (isSuitable === false)');
  assert(
    blankResult.issueDescription?.includes('blank or uniform') ?? false,
    'Blank image gives descriptive issue message',
    blankResult.issueDescription
  );

  // Case 5: Underexposed image
  console.log('\nCase 5: Underexposed image verification:');
  const darkData = createSyntheticRgba(100, 100, (x, y) => ({
    r: 10 + (x % 5),
    g: 10 + (y % 5),
    b: 10
  }));
  const darkResult = evaluateImageQualityFromPixels(darkData, 100, 100);
  assert(!darkResult.isSuitable, 'Underexposed image rejected (isSuitable === false)');
  assert(
    darkResult.issueDescription?.includes('extremely dark') ?? false,
    'Underexposed image gives lighting guidance',
    darkResult.issueDescription
  );

  // Case 6: Overexposed image
  console.log('\nCase 6: Overexposed image verification:');
  const brightData = createSyntheticRgba(100, 100, (x, y) => ({
    r: 250 + (x % 4),
    g: 250 + (y % 4),
    b: 250
  }));
  const brightResult = evaluateImageQualityFromPixels(brightData, 100, 100);
  assert(!brightResult.isSuitable, 'Overexposed image rejected (isSuitable === false)');
  assert(
    brightResult.issueDescription?.includes('overexposed or washed out') ?? false,
    'Overexposed image gives glare warning',
    brightResult.issueDescription
  );

  // Case 2: Blurry leaf vs Sharp leaf (Laplacian Variance edge detection)
  console.log('\nCase 2: Blurry image vs Sharp image (Laplacian Variance):');

  // Synthetic sharp leaf pattern: High-contrast edges (simulating veins and leaf boundary)
  const sharpData = createSyntheticRgba(100, 100, (x, y) => {
    // Sharp checker/stripe pattern with steep 1-pixel transitions
    const isLeafVein = (x % 10 === 0) || (y % 10 === 0);
    const isLeafBody = ((x + y) % 16 < 8);
    if (isLeafVein) return { r: 40, g: 180, b: 50 };
    if (isLeafBody) return { r: 30, g: 110, b: 35 };
    return { r: 70, g: 150, b: 60 };
  });

  const sharpResult = evaluateImageQualityFromPixels(sharpData, 100, 100);
  assert(sharpResult.isSuitable, 'Sharp pattern passes quality check');
  assert(!sharpResult.isBlurry, 'Sharp pattern is not flagged as blurry');
  assert((sharpResult.blurScore ?? 0) > PROVISIONAL_BLUR_THRESHOLD, 'Sharp pattern blurScore exceeds threshold', `blurScore: ${sharpResult.blurScore}`);

  // Synthetic blurry leaf pattern: Smooth gradients (edges spread across 25 pixels)
  const blurryData = createSyntheticRgba(100, 100, (x, y) => {
    // Very gentle sinusoidal transition (no high frequency edges)
    const val = 128 + 60 * Math.sin((x / 100) * Math.PI) * Math.cos((y / 100) * Math.PI);
    return { r: val * 0.4, g: val, b: val * 0.3 };
  });

  const blurryResult = evaluateImageQualityFromPixels(blurryData, 100, 100);
  assert(!blurryResult.isSuitable, 'Blurry image rejected (isSuitable === false)');
  assert(blurryResult.isBlurry === true, 'Blurry image has isBlurry === true');
  assert(
    blurryResult.issueDescription?.includes('blurry or out of focus') ?? false,
    'Blurry image returns actionable farmer guidance',
    blurryResult.issueDescription
  );
  assert((blurryResult.blurScore ?? 0) < PROVISIONAL_BLUR_THRESHOLD, 'Blurry blurScore is below threshold', `blurScore: ${blurryResult.blurScore}`);

  // Low-contrast image check: Sharp low-contrast leaf MUST NOT be falsely rejected
  console.log('\nLow-contrast image edge case (avoid false blur rejections):');
  // Low-contrast sharp image: Range [110..130], contrast stdDev ~ 10, but 1-pixel step edges
  const lowContrastSharpData = createSyntheticRgba(100, 100, (x, _y) => {
    const isEdge = (x % 6 === 0);
    const lum = isEdge ? 130 : 110;
    return { r: lum, g: lum, b: lum };
  });

  const lowContrastSharpResult = evaluateImageQualityFromPixels(lowContrastSharpData, 100, 100);
  assert(lowContrastSharpResult.contrast! < 25, 'Confirmed image is in low-contrast regime', `contrast: ${lowContrastSharpResult.contrast}`);
  assert(lowContrastSharpResult.contrast! >= 5, 'Confirmed image is above blank threshold', `contrast: ${lowContrastSharpResult.contrast}`);
  assert(lowContrastSharpResult.isSuitable, 'Sharp low-contrast image is NOT falsely rejected as blurry');
  assert(!lowContrastSharpResult.isBlurry, 'isBlurry is false for sharp low-contrast image');

  // Low-contrast BLURRY image: Range [105..135], smooth gradient across 100px (stdDev ~10, > 5, < 25)
  const lowContrastBlurryData = createSyntheticRgba(100, 100, (x, y) => {
    const lum = 105 + 30 * Math.sin((x / 100) * Math.PI) * Math.cos((y / 100) * Math.PI);
    return { r: lum, g: lum, b: lum };
  });
  const lowContrastBlurryResult = evaluateImageQualityFromPixels(lowContrastBlurryData, 100, 100);
  assert(lowContrastBlurryResult.contrast! >= 5, 'Blurry low-contrast image is above blank threshold', `contrast: ${lowContrastBlurryResult.contrast}`);
  assert(lowContrastBlurryResult.contrast! < 25, 'Blurry low-contrast image is in low-contrast regime', `contrast: ${lowContrastBlurryResult.contrast}`);
  assert(!lowContrastBlurryResult.isSuitable, 'Blurry low-contrast image is correctly rejected');
  assert(lowContrastBlurryResult.isBlurry === true, 'Blurry low-contrast image isBlurry === true');

  // Small image safety test
  console.log('\nSmall image handling safety:');
  const tinyData = createSyntheticRgba(10, 10, (x, y) => ({
    r: 60 + x * 10,
    g: 80 + y * 10,
    b: 100
  }));
  const tinyResult = evaluateImageQualityFromPixels(tinyData, 10, 10);
  assert(tinyResult.isSuitable, 'Tiny 10x10 non-blank image processed safely without throw/crash');
  const _sub3Data = createSyntheticRgba(2, 2, () => ({ r: 100, g: 150, b: 100 }));
  assert(_sub3Data.length === 16, '2x2 synthetic RGBA buffer allocated');
  const lapVar2x2 = computeLaplacianVariance(new Float32Array([100, 100, 100, 100]), 2, 2);
  assert(lapVar2x2 === 0, '2x2 image returns 0 without convolution out-of-bounds');

  // --------------------------------------------------------------------------
  // TEST SECTION 2: PIPELINE ORCHESTRATOR & FALLBACK ELIMINATION
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Pipeline Orchestrator & Fallback Elimination Tests ---');

  // Load genuine tomato image if available on disk
  const sampleDiskImage = path.join(process.cwd(), 'data', 'corrections', 'images', 'tomato_Tomato___Late_blight_1792351364040_40c68d51.jpg');
  let genuineDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  if (fs.existsSync(sampleDiskImage)) {
    const fileBytes = fs.readFileSync(sampleDiskImage);
    genuineDataUrl = `data:image/jpeg;base64,${fileBytes.toString('base64')}`;
    console.log(`  [INFO] Genuine tomato image loaded: ${path.basename(sampleDiskImage)} (${fileBytes.length} bytes)`);
  }

  // Setup spies / mock stages for orchestrator
  let classifierCallCount = 0;
  let lastClassifiedImage = '';

  const spyClassifier: IDiseaseClassifier = {
    name: 'Spied MobileNetV3 Classifier',
    modelIdentifier: 'best_tomato_mobilenetv3_v2.pth',
    modelInfo: MOBILENETV3_V2_METADATA,
    classify: async (imgUrl: string) => {
      classifierCallCount++;
      lastClassifiedImage = imgUrl;
      return {
        predictedClassIndex: 1,
        predictedClassName: 'Tomato___Early_blight',
        disease: {
          id: 'tomato-early-blight',
          cropId: 'tomato',
          name: 'Early Blight',
          scientificName: 'Alternaria solani',
          description: 'A fungal disease causing dark spots with concentric rings.',
          commonSymptoms: ['Concentric rings', 'Target spots'],
          generalManagement: ['Fungicide spray'],
          preventativeMeasures: ['Crop rotation']
        },
        topConfidence: 94.5,
        confidenceLevel: 'High',
        confidenceLabel: 'High-confidence model prediction',
        classProbabilities: [
          { classIndex: 1, className: 'Tomato___Early_blight', displayName: 'Early Blight', probability: 94.5 }
        ],
        rawLogits: [0, 4.2, 0, 0, 0, 0, 0, 0, 0, 0],
        modelName: 'MobileNetV3 V2',
        inferenceTimeMs: 42
      };
    }
  };

  const passThroughSegmenter: ILeafSegmenter = {
    name: 'Test Segmenter',
    modelIdentifier: 'test-sam',
    segmentLeaf: async (_img: string, det: LeafDetection): Promise<LeafSegmentation> => ({
      detectionId: det.id,
      isolatedLeafImageUrl: det.croppedImageUrl
    })
  };

  const dummyExplainer: IExplainabilityEngine = {
    name: 'Test Explainer',
    modelIdentifier: 'test-lime',
    explain: async () => ({
      summary: 'Test explanation completed',
      topFeatures: []
    })
  };

  // Case 3 & Regression 1: No leaf detected -> Pipeline STOPS before classification
  console.log('\nCase 3 & Regression 1: Genuine No-Leaf Detection:');
  {
    classifierCallCount = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 45 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(spyClassifier);
    orchestrator.setExplainer(dummyExplainer);

    // Mock detector that genuinely found no leaf
    const noLeafDetector: ILeafDetector = {
      name: 'YOLO Detector (Empty Detections)',
      modelIdentifier: 'yolo11n_leaf_v1_best.onnx',
      detectLeaves: async () => [] // 0 leaves found!
    };
    orchestrator.setDetector(noLeafDetector);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws error when no leaf is detected');
    assert(
      errorThrown?.message === 'No plant leaf detected. Please take a clear, close-up photo of a plant leaf.',
      'Exact required user-friendly error message is displayed',
      errorThrown?.message
    );
    assert(
      classifierCallCount === 0,
      'REGRESSION VERIFIED: MobileNetV3 tomato classifier was NEVER called on no-leaf image'
    );
  }

  // Case 1 & Regression 2: Valid leaf detected -> Pipeline completes and calls classifier
  console.log('\nCase 1 & Regression 2: Clear tomato leaf detected:');
  {
    classifierCallCount = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 125, contrast: 55, blurScore: 180 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(spyClassifier);
    orchestrator.setExplainer(dummyExplainer);

    const validLeafDetector: ILeafDetector = {
      name: 'YOLO Detector (Valid Detection)',
      modelIdentifier: 'yolo11n_leaf_v1_best.onnx',
      detectLeaves: async () => [
        {
          id: 'leaf-yolo-1',
          box: { x: 0.1, y: 0.1, width: 0.8, height: 0.8, coordinateType: 'normalized' },
          confidence: 0.88,
          label: 'Target Leaf (88.0%)',
          croppedImageUrl: 'data:image/jpeg;base64,croppedLeafData'
        }
      ]
    };
    orchestrator.setDetector(validLeafDetector);

    const result = await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });

    assert(result !== null, 'Pipeline run successfully returns analysis result');
    assert(classifierCallCount === 1, 'REGRESSION VERIFIED: Tomato classifier was called exactly once for valid leaf');
    assert(lastClassifiedImage.length > 0, 'Classified image received by classifier');
    assert(result.predictedClassName === 'Tomato___Early_blight', 'Predicted class name matches model output');
    assert(result.confidence === 94.5, 'Confidence score matches model output');
    assert(result.detectedLeaves.length === 1, 'Detected leaves populated in result');
    assert(result.pipelineStages.length === 5, 'All 5 pipeline stages completed successfully');
  }

  // Case 7: YOLO inference failure -> Reported as inference error, NOT "no leaf detected"
  console.log('\nCase 7: YOLO inference failure distinction:');
  {
    classifierCallCount = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 50 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(spyClassifier);
    orchestrator.setExplainer(dummyExplainer);

    const crashingDetector: ILeafDetector = {
      name: 'Failing YOLO Detector',
      modelIdentifier: 'yolo11n_leaf_v1_best.onnx',
      detectLeaves: async () => {
        throw new Error('WASM session runtime error: tensor dimension mismatch [1, 3, 640, 640]');
      }
    };
    orchestrator.setDetector(crashingDetector);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws error on YOLO inference failure');
    assert(
      errorThrown?.message.includes('YOLO Leaf Detection Failed: WASM session runtime error') ?? false,
      'Error distinguishes inference failure from no-leaf detection',
      errorThrown?.message
    );
    assert(
      !errorThrown?.message.includes('No plant leaf detected'),
      'Inference failure is NOT masked as "No plant leaf detected"'
    );
    assert(classifierCallCount === 0, 'Tomato classifier was NOT called on inference error');
  }

  // Case 8: Model-loading failure -> Handled without false diagnosis
  console.log('\nCase 8: Model-loading failure:');
  {
    classifierCallCount = 0;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 50 }));
    orchestrator.setSegmenter(passThroughSegmenter);
    orchestrator.setClassifier(spyClassifier);
    orchestrator.setExplainer(dummyExplainer);

    const missingModelDetector: ILeafDetector = {
      name: 'Missing Model Detector',
      modelIdentifier: 'yolo11n_leaf_v1_best.onnx',
      detectLeaves: async () => {
        throw new Error("Failed to initialize YOLO11n leaf detector session from '/models/yolo11n_leaf_v1_best.onnx'. Ensure 'yolo11n_leaf_v1_best.onnx' is present in public/models/.");
      }
    };
    orchestrator.setDetector(missingModelDetector);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws error on model-loading failure');
    assert(
      errorThrown?.message.includes('Failed to initialize YOLO11n leaf detector session') ?? false,
      'Model loading error message preserved without false diagnosis',
      errorThrown?.message
    );
    assert(classifierCallCount === 0, 'No false tomato diagnosis produced when model fails to load');
  }

  // Case 2 in Pipeline: Blurry leaf stopped at Stage 1
  console.log('\nCase 2 in Pipeline: Blurry leaf stops at Stage 1 (Quality Check):');
  {
    classifierCallCount = 0;
    let detectorCalled = false;
    const orchestrator = new PipelineOrchestrator();
    orchestrator.setQualityValidator(async () => ({
      isSuitable: false,
      isBlurry: true,
      issueDescription: 'Image appears blurry or out of focus. Please hold your camera steady, ensure good lighting, and take a sharp, close-up photo of the leaf.',
      brightness: 110,
      contrast: 35,
      blurScore: 12.4
    }));
    orchestrator.setDetector({
      name: 'Detector',
      modelIdentifier: 'yolo11n',
      detectLeaves: async () => {
        detectorCalled = true;
        return [];
      }
    });
    orchestrator.setClassifier(spyClassifier);

    let errorThrown: Error | null = null;
    try {
      await orchestrator.run(genuineDataUrl, { cropId: 'tomato' });
    } catch (e) {
      errorThrown = e instanceof Error ? e : new Error(String(e));
    }

    assert(errorThrown !== null, 'Pipeline throws error on blurry leaf image');
    assert(
      errorThrown?.message.includes('Image appears blurry or out of focus') ?? false,
      'Blurry error message displayed to farmer',
      errorThrown?.message
    );
    assert(!detectorCalled, 'YOLO detector was NEVER called on blurry image');
    assert(classifierCallCount === 0, 'Classifier was NEVER called on blurry image');
  }

  // Regression 3: Existing correction submission & scan history behavior
  console.log('\n--- SECTION 3: Regression Verification for Corrections & Scan History ---');
  console.log('Running test_phase1 storage and correction regression test...');
  const { execSync } = await import('node:child_process');
  try {
    const phase1Output = execSync('npx tsx scripts/test_phase1.ts', { encoding: 'utf-8' });
    assert(
      phase1Output.includes('ALL PHASE 1 STORAGE CHECKS PASSED'),
      'Regression test scripts/test_phase1.ts passed cleanly'
    );
    assert(
      phase1Output.includes('All 8 required fields verified'),
      'Correction record 8 required fields verified in regression'
    );
    assert(
      phase1Output.includes('Duplicate prevention verified'),
      'Duplicate prevention verified in regression'
    );
  } catch (err) {
    assert(false, 'scripts/test_phase1.ts execution failed', String(err));
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
}

runTestSuite().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
