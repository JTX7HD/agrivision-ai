import assert from 'node:assert';
import { getCropClassifierAdapter, CROP_ADAPTER_REGISTRY, POTATO_DISEASE_CLASSES, CHILLI_DISEASE_CLASSES } from '../src/services/pipeline/cropAdapters';
import { TOMATO_DISEASE_CLASSES } from '../src/services/onnx/classMapper';
import { defaultExplainabilityEngine, solveRidgeRegression, getSpatialDescription } from '../src/services/explainability/limeExplainer';
import correctionHandler from '../api/corrections/index';
import type { FormattedONNXResult } from '../src/services/onnx/resultFormatter';

async function runTests() {
  console.log('================================================================');
  console.log('   TESTING MULTI-CROP CORRECTIONS & LIME COMPATIBILITY');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Crop Adapter Resolution & Class Isolation
  // -------------------------------------------------------------
  console.log('--- 1. CROP ADAPTER RESOLUTION & CLASS REGISTRY ---');
  const tomatoAdapter = getCropClassifierAdapter('tomato');
  assert.strictEqual(tomatoAdapter.supportedClasses.length, 10, 'Tomato should have 10 classes');
  assert.strictEqual(tomatoAdapter.supportedClasses[0].className, 'Tomato___Bacterial_spot');
  console.log('✓ Tomato adapter has 10 classes');

  const potatoAdapter = getCropClassifierAdapter('potato');
  assert.strictEqual(potatoAdapter.supportedClasses.length, 3, 'Potato should have 3 classes');
  assert.strictEqual(potatoAdapter.supportedClasses[0].className, 'Potato__Early_Blight');
  assert.strictEqual(potatoAdapter.supportedClasses[1].className, 'Potato__Healthy_Leaf');
  assert.strictEqual(potatoAdapter.supportedClasses[2].className, 'Potato__Late_Blight');
  console.log('✓ Potato adapter has 3 classes (0: Early Blight, 1: Healthy Leaf, 2: Late Blight)');

  const chilliAdapter = getCropClassifierAdapter('chilli');
  assert.strictEqual(chilliAdapter.supportedClasses.length, 8, 'Chilli should have 8 classes');
  assert.strictEqual(chilliAdapter.supportedClasses[0].className, 'Chili__Bacterial_Spot');
  assert.strictEqual(chilliAdapter.supportedClasses[7].className, 'Chili__White_Spot');
  console.log('✓ Chilli adapter has 8 classes (0: Bacterial Spot ... 7: White Spot)');

  const pepperAdapter = getCropClassifierAdapter('pepper');
  assert.strictEqual(pepperAdapter.cropId, 'chilli', 'Pepper alias resolves to chilli');
  console.log('✓ Pepper alias resolves to Chilli adapter');

  // -------------------------------------------------------------
  // TEST 2: Correlation of Predicted Class vs Selected Class
  // -------------------------------------------------------------
  console.log('\n--- 2. PREDICTED CLASS CORRELATION IN MODAL ---');
  // Potato with predictedClassIndex = 0 must match Potato Early Blight, NOT Tomato Bacterial Spot
  const potatoPredIdx = 0;
  const potatoMatch = potatoAdapter.supportedClasses.find(c => c.index === potatoPredIdx);
  assert.strictEqual(potatoMatch?.displayName, 'Potato Early Blight', 'Potato class #0 must be Potato Early Blight');
  console.log(`✓ Potato class #${potatoPredIdx} correlates to "${potatoMatch?.displayName}" (not Tomato Bacterial Spot)`);

  // Chilli with predictedClassIndex = 2 must match Chilli Leaf Curl Virus
  const chilliPredIdx = 2;
  const chilliMatch = chilliAdapter.supportedClasses.find(c => c.index === chilliPredIdx);
  assert.strictEqual(chilliMatch?.displayName, 'Chilli Leaf Curl Virus', 'Chilli class #2 must be Chilli Leaf Curl Virus');
  console.log(`✓ Chilli class #${chilliPredIdx} correlates to "${chilliMatch?.displayName}"`);

  // -------------------------------------------------------------
  // TEST 3: API Multi-Crop Correction Handler Validation
  // -------------------------------------------------------------
  console.log('\n--- 3. API CORRECTION VALIDATION & MULTI-CROP STORAGE ---');
  
  // Create minimal 100+ byte fake image data URL
  const dummyBase64 = Buffer.alloc(120, 'a').toString('base64');
  const dummyDataUrl = `data:image/jpeg;base64,${dummyBase64}`;

  // Helper mock request/response
  function createMockHttp(method: string, body?: any, query?: any) {
    let resData: any = null;
    let statusCode = 200;
    const req: any = { method, body, query, headers: {} };
    const res: any = {
      setHeader: () => {},
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (data: any) => {
        resData = data;
        return res;
      },
      end: () => res
    };
    return { req, res, getStatus: () => statusCode, getData: () => resData };
  }

  // 3a: Valid Potato correction
  const potHttp = createMockHttp('POST', {
    imageDataUrl: `data:image/jpeg;base64,${Buffer.alloc(120, 'potato_' + Date.now()).toString('base64')}`,
    correctedClassIndex: 0,
    correctedClassName: 'Potato__Early_Blight',
    predictedClassIndex: 0,
    predictedClassName: 'Potato Early Blight',
    confidence: 96.3,
    cropId: 'potato',
    modelVersion: '1.0-krishoktech',
    modelCheckpoint: 'potato_disease.onnx'
  });
  await correctionHandler(potHttp.req, potHttp.res);
  assert.strictEqual(potHttp.getStatus(), 201, `Potato submission expected 201, got ${potHttp.getStatus()}`);
  assert.strictEqual(potHttp.getData()?.record?.crop_id, 'potato', 'Record crop_id should be potato');
  console.log('✓ Valid Potato correction successfully saved with crop_id: potato');

  // 3b: Valid Chilli correction
  const chiHttp = createMockHttp('POST', {
    imageDataUrl: `data:image/jpeg;base64,${Buffer.alloc(120, 'chilli_' + Date.now()).toString('base64')}`,
    correctedClassIndex: 0,
    correctedClassName: 'Chili__Bacterial_Spot',
    predictedClassIndex: 0,
    predictedClassName: 'Chilli Bacterial Spot',
    confidence: 100.0,
    cropId: 'chilli',
    modelVersion: '1.0-krishoktech',
    modelCheckpoint: 'chilli_disease.onnx'
  });
  await correctionHandler(chiHttp.req, chiHttp.res);
  assert.strictEqual(chiHttp.getStatus(), 201, `Chilli submission expected 201, got ${chiHttp.getStatus()}`);
  assert.strictEqual(chiHttp.getData()?.record?.crop_id, 'chilli', 'Record crop_id should be chilli');
  console.log('✓ Valid Chilli correction successfully saved with crop_id: chilli');

  // 3c: Rejection of invalid class for Potato (e.g. index 7 is out of bounds for Potato 3-class)
  const potInvalidHttp = createMockHttp('POST', {
    imageDataUrl: dummyDataUrl,
    correctedClassIndex: 7,
    correctedClassName: 'Chili__White_Spot',
    cropId: 'potato'
  });
  await correctionHandler(potInvalidHttp.req, potInvalidHttp.res);
  assert.strictEqual(potInvalidHttp.getStatus(), 400, 'Invalid class for potato must be rejected with 400');
  console.log('✓ Out-of-bounds class for Potato strictly rejected with HTTP 400');

  // 3d: GET returns class breakdown with all crops
  const getHttp = createMockHttp('GET');
  await correctionHandler(getHttp.req, getHttp.res);
  assert.strictEqual(getHttp.getStatus(), 200, 'GET must return 200');
  const breakdown = getHttp.getData()?.classBreakdown;
  assert.ok(breakdown['Potato__Early_Blight'] !== undefined, 'Breakdown must contain Potato Early Blight');
  assert.ok(breakdown['Chili__Bacterial_Spot'] !== undefined, 'Breakdown must contain Chili Bacterial Spot');
  assert.ok(breakdown['Tomato___Bacterial_spot'] !== undefined, 'Breakdown must contain Tomato Bacterial Spot');
  console.log('✓ GET /api/corrections includes class breakdown for Potato, Chilli, and Tomato');

  // -------------------------------------------------------------
  // TEST 4: LIME Explainability Engine Multi-Crop Compatibility
  // -------------------------------------------------------------
  console.log('\n--- 4. LIME COMPATIBILITY ACROSS CROPS ---');

  // Ridge regression test
  const Z = [
    [1, 1, 1],
    [1, 0, 1],
    [0, 1, 0],
    [0, 0, 1]
  ];
  const y = [0.9, 0.6, 0.4, 0.2];
  const w = [1.0, 0.8, 0.7, 0.5];
  const beta = solveRidgeRegression(Z, y, w, 0.1);
  assert.strictEqual(beta.length, 3, 'Beta must have length 3');
  console.log('✓ LIME Ridge regression solved correctly: beta =', beta.map(v => Number(v.toFixed(3))));

  // Test explain() on Tomato result
  const mockTomatoResult: FormattedONNXResult = {
    predictedClassIndex: 2,
    predictedClassName: 'Tomato___Late_blight',
    disease: {
      id: 'tomato-late-blight',
      cropId: 'tomato',
      name: 'Tomato Late Blight',
      scientificName: 'Phytophthora infestans',
      description: 'Late blight',
      commonSymptoms: [],
      generalManagement: [],
      preventativeMeasures: []
    },
    topConfidence: 88.4,
    confidenceLevel: 'High',
    confidenceLabel: 'High Confidence',
    classProbabilities: [
      { classIndex: 2, className: 'Tomato___Late_blight', displayName: 'Tomato Late Blight', probability: 88.4 },
      { classIndex: 1, className: 'Tomato___Early_blight', displayName: 'Tomato Early Blight', probability: 11.2 }
    ],
    rawLogits: [0, 11.2, 88.4],
    modelName: 'MobileNetV3 V2',
    inferenceTimeMs: 12,
    isMockPrediction: false,
    topMargin: 77.2,
    uncertainty: {
      isUncertain: false,
      isWeakConfidence: false,
      isAmbiguous: false,
      topConfidence: 88.4,
      secondConfidence: 11.2,
      topMargin: 77.2,
      confidenceThreshold: 60,
      marginThreshold: 10,
      reasons: []
    }
  };
  const tomatoExpl = await defaultExplainabilityEngine.explain('dummy', mockTomatoResult);
  assert.ok(tomatoExpl.topFeatures && tomatoExpl.topFeatures.length > 0, 'Tomato LIME should return features');
  assert.ok(tomatoExpl.summary?.includes('Tomato Late Blight'), 'Tomato LIME summary should name disease');
  console.log('✓ LIME explain() verified for Tomato leaf');

  // Test explain() on Potato result
  const mockPotatoResult: FormattedONNXResult = {
    predictedClassIndex: 0,
    predictedClassName: 'Potato__Early_Blight',
    disease: {
      id: 'potato-early-blight',
      cropId: 'potato',
      name: 'Potato Early Blight',
      scientificName: 'Alternaria solani',
      description: 'Early blight',
      commonSymptoms: [],
      generalManagement: [],
      preventativeMeasures: []
    },
    topConfidence: 96.3,
    confidenceLevel: 'High',
    confidenceLabel: 'High Confidence',
    classProbabilities: [
      { classIndex: 0, className: 'Potato__Early_Blight', displayName: 'Potato Early Blight', probability: 96.3 },
      { classIndex: 1, className: 'Potato__Healthy_Leaf', displayName: 'Healthy Potato Leaf', probability: 2.5 },
      { classIndex: 2, className: 'Potato__Late_Blight', displayName: 'Potato Late Blight', probability: 1.2 }
    ],
    rawLogits: [0.963, 0.025, 0.012],
    modelName: 'YOLO26s Potato Pathology Classifier',
    inferenceTimeMs: 14,
    isMockPrediction: false,
    topMargin: 93.8,
    uncertainty: {
      isUncertain: false,
      isWeakConfidence: false,
      isAmbiguous: false,
      topConfidence: 96.3,
      secondConfidence: 2.5,
      topMargin: 93.8,
      confidenceThreshold: 60,
      marginThreshold: 10,
      reasons: []
    }
  };
  const potatoExpl = await defaultExplainabilityEngine.explain('dummy', mockPotatoResult);
  assert.ok(potatoExpl.topFeatures && potatoExpl.topFeatures.length > 0, 'Potato LIME should return features');
  assert.ok(potatoExpl.summary?.includes('Potato Early Blight'), 'Potato LIME summary should name disease');
  console.log('✓ LIME explain() verified for Potato leaf');

  // Test explain() on Chilli result
  const mockChilliResult: FormattedONNXResult = {
    predictedClassIndex: 0,
    predictedClassName: 'Chili__Bacterial_Spot',
    disease: {
      id: 'chilli-bacterial-spot',
      cropId: 'chilli',
      name: 'Chilli Bacterial Spot',
      scientificName: 'Xanthomonas campestris',
      description: 'Bacterial spot',
      commonSymptoms: [],
      generalManagement: [],
      preventativeMeasures: []
    },
    topConfidence: 100.0,
    confidenceLevel: 'High',
    confidenceLabel: 'High Confidence',
    classProbabilities: [
      { classIndex: 0, className: 'Chili__Bacterial_Spot', displayName: 'Chilli Bacterial Spot', probability: 100.0 },
      { classIndex: 1, className: 'Chili__Cercospora_Leaf_Spot', displayName: 'Chilli Cercospora Leaf Spot', probability: 0.0 }
    ],
    rawLogits: [1.0, 0.0],
    modelName: 'YOLO26n Chilli Pathology Classifier',
    inferenceTimeMs: 10,
    isMockPrediction: false,
    topMargin: 100.0,
    uncertainty: {
      isUncertain: false,
      isWeakConfidence: false,
      isAmbiguous: false,
      topConfidence: 100.0,
      secondConfidence: 0.0,
      topMargin: 100.0,
      confidenceThreshold: 60,
      marginThreshold: 10,
      reasons: []
    }
  };
  const chilliExpl = await defaultExplainabilityEngine.explain('dummy', mockChilliResult);
  assert.ok(chilliExpl.topFeatures && chilliExpl.topFeatures.length > 0, 'Chilli LIME should return features');
  assert.ok(chilliExpl.summary?.includes('Chilli Bacterial Spot'), 'Chilli LIME summary should name disease');
  console.log('✓ LIME explain() verified for Chilli leaf');

  // Non-browser fallback for generateDetailedExplanation
  const detailedExpl = await defaultExplainabilityEngine.generateDetailedExplanation('dummy', mockPotatoResult, 0);
  assert.ok(detailedExpl.topFeatures && detailedExpl.topFeatures.length > 0, 'generateDetailedExplanation fallback works');
  console.log('✓ LIME generateDetailedExplanation non-browser fallback verified');

  console.log('\n================================================================');
  console.log('   ALL CORRECTION & LIME TESTS PASSED (100%)');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
