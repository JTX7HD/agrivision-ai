import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Import Sprint Modules
import {
  POTATO_DISEASE_CLASSES,
  PEPPER_DISEASE_CLASSES,
  MAIZE_DISEASE_CLASSES,
  PotatoClassifierAdapter,
  ChilliClassifierAdapter,
  PepperClassifierAdapter,
  MaizeClassifierAdapter,
  TomatoClassifierAdapter,
  CropModelUnavailableError
} from '../src/services/pipeline/cropAdapters';
import { MultiCropDiseaseClassifier } from '../src/services/pipeline/diseaseClassifierService';
import { DISEASES_KNOWLEDGE_BASE, getDefaultDiseaseKnowledgeForCrop } from '../src/data/diseasesData';
import { en } from '../src/i18n/locales/en';
import { hi } from '../src/i18n/locales/hi';
import { defaultExplainabilityEngine, solveRidgeRegression, getSpatialDescription } from '../src/services/explainability/limeExplainer';
import { getSAMStatus, SAMLeafSegmenter } from '../src/services/pipeline/leafSegmentationService';

async function runSprintVerification() {
  console.log('================================================================');
  console.log('   AGRIVISION AI — SIX-HOUR SPRINT VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 1: CROP ADAPTERS & MODEL IDENTIFICATION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('--- 1. CROP ADAPTERS & CLASS MAPPING INTEGRITY ---');

  // Potato Adapter
  const potatoAdapter = new PotatoClassifierAdapter();
  assert(potatoAdapter.cropId === 'potato', 'Potato adapter cropId is "potato"');
  assert(potatoAdapter.supportedClasses.length === 3, 'Potato adapter supports exactly 3 classes');
  assert(potatoAdapter.supportedClasses[0].className === 'Potato__Early_Blight', 'Potato class 0 is Early Blight');
  assert(potatoAdapter.supportedClasses[1].className === 'Potato__Healthy_Leaf', 'Potato class 1 is Healthy');
  assert(potatoAdapter.supportedClasses[2].className === 'Potato__Late_Blight', 'Potato class 2 is Late Blight');
  assert(potatoAdapter.expectedModelPath === '/models/potato_disease.onnx', 'Potato expected model path configured correctly');

  // Chilli Adapter
  const chilliAdapter = new ChilliClassifierAdapter();
  assert(chilliAdapter.cropId === 'chilli', 'Chilli adapter cropId is "chilli"');
  assert(chilliAdapter.supportedClasses.length === 8, 'Chilli adapter supports exactly 8 classes');
  assert(chilliAdapter.supportedClasses[0].className === 'Chili__Bacterial_Spot', 'Chilli class 0 is Bacterial Spot');
  assert(chilliAdapter.supportedClasses[1].className === 'Chili__Cercospora_Leaf_Spot', 'Chilli class 1 is Cercospora Leaf Spot');
  assert(chilliAdapter.supportedClasses[2].className === 'Chili__Curl_Virus', 'Chilli class 2 is Chilli Leaf Curl Virus');
  assert(chilliAdapter.supportedClasses[3].className === 'Chili__Healthy_Leaf', 'Chilli class 3 is Healthy Leaf');
  assert(chilliAdapter.supportedClasses[4].className === 'Chili__Nutrition_Deficiency', 'Chilli class 4 is Nutrient Deficiency');
  assert(chilliAdapter.supportedClasses[5].className === 'Others', 'Chilli class 5 is Others');
  assert(chilliAdapter.supportedClasses[6].className === 'Chili__Powdery_Mildew', 'Chilli class 6 is Powdery Mildew');
  assert(chilliAdapter.supportedClasses[7].className === 'Chili__White_Spot', 'Chilli class 7 is White Spot / Anthracnose');
  assert(chilliAdapter.expectedModelPath === '/models/chilli_disease.onnx', 'Chilli expected model path configured correctly');

  // Maize Adapter
  const maizeAdapter = new MaizeClassifierAdapter();
  assert(maizeAdapter.cropId === 'maize', 'Maize adapter cropId is "maize"');
  assert(maizeAdapter.supportedClasses.length === 4, 'Maize adapter supports exactly 4 classes');

  // Model Routing & Cross-Routing Guard
  const dispatcher = new MultiCropDiseaseClassifier();
  let blockedMaizeCrossRoute = false;
  try {
    // Attempting to classify maize without standalone ONNX file installed
    await dispatcher.classify('data:image/jpeg;base64,/9j/4AAQSkZJRg==', 'maize');
  } catch (err: any) {
    if (err instanceof CropModelUnavailableError) {
      blockedMaizeCrossRoute = true;
    }
  }
  assert(blockedMaizeCrossRoute, 'Classifier successfully BLOCKS silent fallback of Maize to Tomato model');

  let blockedRiceCrossRoute = false;
  try {
    await dispatcher.classify('data:image/jpeg;base64,/9j/4AAQSkZJRg==', 'rice');
  } catch (err: any) {
    if (err instanceof CropModelUnavailableError) {
      blockedRiceCrossRoute = true;
    }
  }
  assert(blockedRiceCrossRoute, 'Classifier successfully BLOCKS silent fallback of Rice to Tomato model');

  let blockedBananaCrossRoute = false;
  try {
    await dispatcher.classify('data:image/jpeg;base64,/9j/4AAQSkZJRg==', 'banana');
  } catch (err: any) {
    if (err instanceof CropModelUnavailableError) {
      blockedBananaCrossRoute = true;
    }
  }
  assert(blockedBananaCrossRoute, 'Classifier successfully BLOCKS silent fallback of Banana to Tomato model');

  console.log('');

  // --------------------------------------------------------------------------
  // TEST SECTION 2: PATHOLOGY & KNOWLEDGE BASE INTEGRITY
  // --------------------------------------------------------------------------
  console.log('--- 2. PATHOLOGY KNOWLEDGE BASE INTEGRITY ---');

  const requiredDiseases = [
    'potato-early-blight',
    'potato-late-blight',
    'potato-healthy',
    'chilli-bacterial-spot',
    'chilli-cercospora-leaf-spot',
    'chilli-leaf-curl-virus',
    'chilli-healthy',
    'chilli-nutrient-deficiency',
    'chilli-others',
    'chilli-powdery-mildew',
    'chilli-white-spot',
    'pepper-bacterial-spot',
    'pepper-healthy',
    'maize-common-rust',
    'maize-northern-blight',
    'maize-gray-leaf-spot',
    'maize-healthy'
  ];

  for (const diseaseId of requiredDiseases) {
    const entry = DISEASES_KNOWLEDGE_BASE[diseaseId];
    assert(!!entry, `Knowledge base contains entry for "${diseaseId}"`);
    assert(entry.commonSymptoms.length > 0, `Symptoms populated for "${diseaseId}"`);
    assert(entry.generalManagement.length > 0, `Management instructions populated for "${diseaseId}"`);
    assert(entry.preventativeMeasures.length > 0, `Preventative measures populated for "${diseaseId}"`);
    assert(!!entry.scientificName, `Scientific name populated for "${diseaseId}": ${entry.scientificName}`);
  }

  const defaultPotato = getDefaultDiseaseKnowledgeForCrop('potato');
  assert(defaultPotato.cropId === 'potato', 'Default disease for potato returns potato entity');
  const defaultChilli = getDefaultDiseaseKnowledgeForCrop('chilli');
  assert(defaultChilli.cropId === 'chilli', 'Default disease for chilli returns chilli entity');

  console.log('');

  // --------------------------------------------------------------------------
  // TEST SECTION 3: LOCALIZATION (EN & HI) & KEY PARITY
  // --------------------------------------------------------------------------
  console.log('--- 3. ENGLISH & HINDI LOCALIZATION INTEGRITY ---');

  function checkKeyParity(enObj: any, hiObj: any, prefix = ''): string[] {
    const missingInHi: string[] = [];
    for (const key of Object.keys(enObj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (!(key in hiObj)) {
        missingInHi.push(fullKey);
      } else if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        missingInHi.push(...checkKeyParity(enObj[key], hiObj[key], fullKey));
      }
    }
    return missingInHi;
  }

  const missingKeys = checkKeyParity(en, hi);
  assert(missingKeys.length === 0, `100% key parity between English and Hindi (${missingKeys.length} missing)`);

  // Verify Hindi Devanagari presence
  const devanagariRegex = /[\u0900-\u097F]/;
  assert(devanagariRegex.test(hi.nav.home), 'Hindi nav.home contains authentic Devanagari script');
  assert(devanagariRegex.test(hi.scan.title), 'Hindi scan.title contains authentic Devanagari script');
  assert(devanagariRegex.test(hi.crops.tomato), 'Hindi crops.tomato contains Devanagari');
  assert(devanagariRegex.test(hi.crops.potato), 'Hindi crops.potato contains Devanagari');
  assert(devanagariRegex.test(hi.crops.chilli), 'Hindi crops.chilli contains Devanagari');
  assert(devanagariRegex.test(hi.lime.title), 'Hindi LIME title contains Devanagari');
  assert(devanagariRegex.test(hi.sam.title), 'Hindi SAM title contains Devanagari');

  // Verify English scientific terms are retained for clarity
  assert(hi.crops.tomato.includes('Tomato'), 'Hindi crop label preserves English name in parenthesis');
  assert(hi.crops.potato.includes('Potato'), 'Hindi crop label preserves English name in parenthesis');
  assert(hi.crops.chilli.includes('Chilli'), 'Hindi crop label preserves English name in parenthesis');

  console.log('');

  // --------------------------------------------------------------------------
  // TEST SECTION 4: LIME EXPLAINABILITY MATHEMATICAL ENGINE
  // --------------------------------------------------------------------------
  console.log('--- 4. LIME EXPLAINABILITY ENGINE ---');

  // Test spatial description generator
  const upperLeftDesc = getSpatialDescription(0, 4);
  assert(upperLeftDesc.includes('Upper-Left'), `Quadrant 0 is Upper-Left: "${upperLeftDesc}"`);
  const lowerRightDesc = getSpatialDescription(15, 4);
  assert(lowerRightDesc.includes('Lower-Right'), `Quadrant 15 is Lower-Right: "${lowerRightDesc}"`);

  // Test local Ridge Regression solver: (Z^T * W * Z + lambda * I) * beta = Z^T * W * y
  // Target linear relationship: y = 2*z0 + 0.5*z1 - 1.5*z2
  const Z_test = [
    [1, 1, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 0]
  ];
  const y_test = [
    2 * 1 + 0.5 * 1 - 1.5 * 1, // 1.0
    2 * 1 + 0.5 * 0 - 1.5 * 1, // 0.5
    2 * 0 + 0.5 * 1 - 1.5 * 1, // -1.0
    2 * 1 + 0.5 * 1 - 1.5 * 0, // 2.5
    2 * 0 + 0.5 * 0 - 1.5 * 1, // -1.5
    2 * 1 + 0.5 * 0 - 1.5 * 0  // 2.0
  ];
  const weights_test = [1, 1, 1, 1, 1, 1];

  const solvedWeights: number[] = solveRidgeRegression(
    Z_test,
    y_test,
    weights_test,
    0.01
  );

  assert(solvedWeights.length === 3, 'Ridge regression returned coefficients for all 3 features');
  assert(solvedWeights[0] > 1.5, `Feature 0 coefficient is strongly positive (~2.0): ${solvedWeights[0].toFixed(3)}`);
  assert(solvedWeights[2] < -1.0, `Feature 2 coefficient is strongly negative (~ -1.5): ${solvedWeights[2].toFixed(3)}`);

  console.log('');

  // --------------------------------------------------------------------------
  // TEST SECTION 5: SAM SEGMENTATION FEASIBILITY & ADAPTER
  // --------------------------------------------------------------------------
  console.log('--- 5. SAM SEGMENTATION FEASIBILITY & ADAPTER ---');

  const samStatus = getSAMStatus();
  assert(samStatus.isAvailable === true, 'Accurately reports real MobileSAM checkpoints are present in client bundle');
  assert(samStatus.mode === 'sam_weights', 'Adapter accurately reports sam_weights active mode');
  assert(samStatus.modelSizeMB > 0, `Documents required model size (~${samStatus.modelSizeMB}MB)`);
  assert(samStatus.modelIdentifier.includes('SAM'), 'Documents required model checkpoint identity');

  const segmenter = new SAMLeafSegmenter();
  const mockImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  const mockDetection = {
    id: 'det-1',
    croppedImageUrl: mockImage,
    box: { x: 0, y: 0, width: 1, height: 1 },
    confidence: 0.95,
    label: 'leaf'
  };
  const segResult = await segmenter.segmentLeaf(mockImage, mockDetection);
  assert(segResult.isPassThrough === true, 'In Node headless environment, gracefully falls back to non-blocking pass-through mode without throwing');
  assert(segResult.samStatus.isAvailable !== undefined, 'Accurately documents SAM model availability');
  assert(segResult.isolatedLeafImageUrl === mockImage, 'Preserves original image fidelity for downstream classification');

  console.log('');

  // --------------------------------------------------------------------------
  // TEST SECTION 6: MANDATORY SAFETY & PRODUCTION REPOSITORY INTEGRITY
  // --------------------------------------------------------------------------
  console.log('--- 6. MANDATORY SAFETY & REPOSITORY INTEGRITY ---');

  const EXPECTED_TOMATO_ONNX_HASH = 'c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5';
  const EXPECTED_YOLO_ONNX_HASH = '37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1';
  const EXPECTED_PTH_HASH = '3c4b7ffad883f88b065e9e1e67bad3f875ab3b48cf9be5b2e4f324318287a771';
  const EXPECTED_POTATO_ONNX_HASH = 'a71016d001d25cca1d263d33ed284dcf9edecc9636d1ca97f525b80d29563a96';
  const EXPECTED_CHILLI_ONNX_HASH = '847674752701490177dc9261ae7b1ccacd30b7489ddca8fe4f9a21cae0b79bce';

  function computeFileSha256(filePath: string): string {
    const fullPath = path.resolve(filePath);
    const buf = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  }

  const tomatoHash = computeFileSha256('public/models/tomato_mobilenetv3_v2.onnx');
  assert(tomatoHash === EXPECTED_TOMATO_ONNX_HASH, 'Production tomato ONNX weight hash is 100% UNCHANGED');

  const yoloHash = computeFileSha256('public/models/yolo11n_leaf_v1_best.onnx');
  assert(yoloHash === EXPECTED_YOLO_ONNX_HASH, 'Production YOLO11n ONNX weight hash is 100% UNCHANGED');

  const pthHash = computeFileSha256('training_artifacts/baseline_tomato_mobilenetv3_v2.pth');
  assert(pthHash === EXPECTED_PTH_HASH, 'Production PyTorch baseline checkpoint hash is 100% UNCHANGED');

  const potatoHash = computeFileSha256('public/models/potato_disease.onnx');
  assert(potatoHash === EXPECTED_POTATO_ONNX_HASH, 'Staged Potato ONNX weight hash matches KrishokTech audit');

  const chilliHash = computeFileSha256('public/models/chilli_disease.onnx');
  assert(chilliHash === EXPECTED_CHILLI_ONNX_HASH, 'Staged Chilli ONNX weight hash matches KrishokTech audit');

  console.log('\n================================================================');
  console.log(`   ALL TESTS PASSED: ${passedTests} / ${totalTests} VERIFIED`);
  console.log('================================================================\n');
}

runSprintVerification().catch((err) => {
  console.error('\nTest Suite Failed with error:', err);
  process.exit(1);
});
