import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as ort from 'onnxruntime-web';
import {
  TomatoClassifierAdapter,
  PotatoClassifierAdapter,
  ChilliClassifierAdapter,
  RiceClassifierAdapter,
  BananaClassifierAdapter,
  POTATO_DISEASE_CLASSES,
  CHILLI_DISEASE_CLASSES,
  CropModelUnavailableError
} from '../src/services/pipeline/cropAdapters';
import { MultiCropDiseaseClassifier } from '../src/services/pipeline/diseaseClassifierService';
import { TOMATO_DISEASE_CLASSES } from '../src/services/onnx/classMapper';
import { runONNXInference } from '../src/services/onnx/inferenceEngine';
import { DISEASES_KNOWLEDGE_BASE } from '../src/data/diseasesData';

async function runMultiCropInferenceTests() {
  console.log('================================================================');
  console.log('   AGRIVISION AI: VERIFIED MULTI-CROP ONNX INFERENCE TEST');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}${detail ? ` (${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` (${detail})` : ''}`);
      failed++;
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: Checkpoint Hash Verification
  // --------------------------------------------------------------------------
  console.log('--- 1. CHECKPOINT HASH & SIZE VERIFICATION ---');

  function computeHash(filePath: string): { hash: string; size: number } {
    const buf = fs.readFileSync(path.resolve(filePath));
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    return { hash, size: buf.length };
  }

  const potatoMeta = computeHash('public/models/potato_disease.onnx');
  assert(
    potatoMeta.hash === 'a71016d001d25cca1d263d33ed284dcf9edecc9636d1ca97f525b80d29563a96',
    'Potato ONNX SHA-256 matches specification',
    `hash: ${potatoMeta.hash}`
  );
  assert(potatoMeta.size === 21798793, 'Potato ONNX exact byte size is 21,798,793 bytes', `${potatoMeta.size} bytes`);

  const chilliMeta = computeHash('public/models/chilli_disease.onnx');
  assert(
    chilliMeta.hash === '847674752701490177dc9261ae7b1ccacd30b7489ddca8fe4f9a21cae0b79bce',
    'Chilli ONNX SHA-256 matches specification',
    `hash: ${chilliMeta.hash}`
  );
  assert(chilliMeta.size === 6191953, 'Chilli ONNX exact byte size is 6,191,953 bytes', `${chilliMeta.size} bytes`);

  const tomatoMeta = computeHash('public/models/tomato_mobilenetv3_v2.onnx');
  assert(
    tomatoMeta.hash === 'c1b55ccfa1dba3212649880a303d30019d4a4b1fa33fc4b822264297a06c5ab5',
    'Production Tomato ONNX SHA-256 is 100% UNCHANGED',
    `hash: ${tomatoMeta.hash}`
  );

  const yoloMeta = computeHash('public/models/yolo11n_leaf_v1_best.onnx');
  assert(
    yoloMeta.hash === '37705fad0ad6248399d770be80c2425e3114d30ea235f565172beb974cc1cac1',
    'Production YOLO11n ONNX SHA-256 is 100% UNCHANGED',
    `hash: ${yoloMeta.hash}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SECTION 2: Model Graph Loading & Tensor Dimension Inspection
  // --------------------------------------------------------------------------
  console.log('--- 2. ONNX MODEL LOADING & GRAPH INSPECTION ---');

  const potatoSession = await ort.InferenceSession.create(
    fs.readFileSync(path.resolve('public/models/potato_disease.onnx'))
  );
  assert(potatoSession.inputNames.length >= 1, 'Potato session loaded with valid input names');
  assert(potatoSession.outputNames.length >= 1, 'Potato session loaded with valid output names');
  console.log(`     Potato: Input='${potatoSession.inputNames[0]}', Output='${potatoSession.outputNames[0]}'`);

  const chilliSession = await ort.InferenceSession.create(
    fs.readFileSync(path.resolve('public/models/chilli_disease.onnx'))
  );
  assert(chilliSession.inputNames.length >= 1, 'Chilli session loaded with valid input names');
  assert(chilliSession.outputNames.length >= 1, 'Chilli session loaded with valid output names');
  console.log(`     Chilli: Input='${chilliSession.inputNames[0]}', Output='${chilliSession.outputNames[0]}'`);

  const tomatoSession = await ort.InferenceSession.create(
    fs.readFileSync(path.resolve('public/models/tomato_mobilenetv3_v2.onnx'))
  );
  assert(tomatoSession.inputNames.length >= 1, 'Tomato session loaded with valid input names');
  assert(tomatoSession.outputNames.length >= 1, 'Tomato session loaded with valid output names');
  console.log(`     Tomato: Input='${tomatoSession.inputNames[0]}', Output='${tomatoSession.outputNames[0]}'`);

  console.log('');

  function makeTestTensor(norm: 'imagenet' | 'unit'): Float32Array {
    const numPixels = 224 * 224;
    const tensor = new Float32Array(3 * numPixels);
    const r = 0.2, g = 0.6, b = 0.2;
    if (norm === 'unit') {
      tensor.fill(r, 0, numPixels);
      tensor.fill(g, numPixels, 2 * numPixels);
      tensor.fill(b, 2 * numPixels, 3 * numPixels);
    } else {
      const mean = [0.485, 0.456, 0.406];
      const std = [0.229, 0.224, 0.225];
      tensor.fill((r - mean[0]) / std[0], 0, numPixels);
      tensor.fill((g - mean[1]) / std[1], numPixels, 2 * numPixels);
      tensor.fill((b - mean[2]) / std[2], 2 * numPixels, 3 * numPixels);
    }
    return tensor;
  }

  // --------------------------------------------------------------------------
  // SECTION 3: Forward Pass & Output Shape Verification
  // --------------------------------------------------------------------------
  console.log('--- 3. REAL FORWARD PASS & TENSOR OUTPUT SHAPES ---');

  // Test 3.1: Potato Forward Pass
  {
    const tensorData = makeTestTensor('unit');
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
    const feeds = { [potatoSession.inputNames[0]]: inputTensor };
    const results = await potatoSession.run(feeds);
    const outputTensor = results[potatoSession.outputNames[0]];

    assert(outputTensor !== undefined, 'Potato forward pass produced output tensor');
    assert(outputTensor.dims.length === 2, 'Potato output tensor has 2 dimensions', `dims: [${outputTensor.dims.join(', ')}]`);
    assert(outputTensor.dims[0] === 1 && outputTensor.dims[1] === 3, 'Potato output shape is exactly [1, 3]');
    const outData = Array.from(outputTensor.data as Float32Array);
    assert(outData.length === 3, 'Potato output data length is exactly 3');

    // Verify output already contains Softmax
    const sumProbs = outData.reduce((a, b) => a + b, 0);
    assert(Math.abs(sumProbs - 1.0) < 0.01, 'Potato raw output values sum to ~1.0 (Softmax included)', `sum: ${sumProbs.toFixed(4)}`);
    assert(outData.every(v => v >= 0 && v <= 1), 'All potato raw output values are in [0.0, 1.0]');
  }

  // Test 3.2: Chilli Forward Pass
  {
    const tensorData = makeTestTensor('unit');
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
    const feeds = { [chilliSession.inputNames[0]]: inputTensor };
    const results = await chilliSession.run(feeds);
    const outputTensor = results[chilliSession.outputNames[0]];

    assert(outputTensor !== undefined, 'Chilli forward pass produced output tensor');
    assert(outputTensor.dims.length === 2, 'Chilli output tensor has 2 dimensions', `dims: [${outputTensor.dims.join(', ')}]`);
    assert(outputTensor.dims[0] === 1 && outputTensor.dims[1] === 8, 'Chilli output shape is exactly [1, 8]');
    const outData = Array.from(outputTensor.data as Float32Array);
    assert(outData.length === 8, 'Chilli output data length is exactly 8');

    // Verify output already contains Softmax
    const sumProbs = outData.reduce((a, b) => a + b, 0);
    assert(Math.abs(sumProbs - 1.0) < 0.01, 'Chilli raw output values sum to ~1.0 (Softmax included)', `sum: ${sumProbs.toFixed(4)}`);
    assert(outData.every(v => v >= 0 && v <= 1), 'All chilli raw output values are in [0.0, 1.0]');
  }

  // Test 3.3: Tomato Forward Pass (Regression check)
  {
    const tensorData = makeTestTensor('imagenet');
    const inputTensor = new ort.Tensor('float32', tensorData, [1, 3, 224, 224]);
    const feeds = { [tomatoSession.inputNames[0]]: inputTensor };
    const results = await tomatoSession.run(feeds);
    const outputTensor = results[tomatoSession.outputNames[0]];

    assert(outputTensor !== undefined, 'Tomato forward pass produced output tensor');
    assert(outputTensor.dims[0] === 1 && outputTensor.dims[1] === 10, 'Tomato output shape is exactly [1, 10]');
    const outData = Array.from(outputTensor.data as Float32Array);
    assert(outData.length === 10, 'Tomato output data length is exactly 10');
  }

  console.log('');

  // --------------------------------------------------------------------------
  // SECTION 4: Class Mappings & Authoritative Index Verification
  // --------------------------------------------------------------------------
  console.log('--- 4. AUTHORITATIVE CLASS MAPPINGS VERIFICATION ---');

  // Potato Mapping
  const potatoAdapter = new PotatoClassifierAdapter();
  assert(potatoAdapter.supportedClasses.length === 3, 'Potato adapter has 3 classes');
  assert(potatoAdapter.supportedClasses[0].index === 0, 'Potato index 0 is mapped');
  assert(potatoAdapter.supportedClasses[0].className === 'Potato__Early_Blight', 'Potato index 0 is Potato__Early_Blight');
  assert(potatoAdapter.supportedClasses[0].displayName === 'Potato Early Blight', 'Potato index 0 displayName is Potato Early Blight');
  assert(potatoAdapter.supportedClasses[1].index === 1, 'Potato index 1 is mapped');
  assert(potatoAdapter.supportedClasses[1].className === 'Potato__Healthy_Leaf', 'Potato index 1 is Potato__Healthy_Leaf');
  assert(potatoAdapter.supportedClasses[1].displayName === 'Healthy Potato Leaf', 'Potato index 1 displayName is Healthy Potato Leaf');
  assert(potatoAdapter.supportedClasses[2].index === 2, 'Potato index 2 is mapped');
  assert(potatoAdapter.supportedClasses[2].className === 'Potato__Late_Blight', 'Potato index 2 is Potato__Late_Blight');
  assert(potatoAdapter.supportedClasses[2].displayName === 'Potato Late Blight', 'Potato index 2 displayName is Potato Late Blight');

  // Chilli Mapping
  const chilliAdapter = new ChilliClassifierAdapter();
  assert(chilliAdapter.supportedClasses.length === 8, 'Chilli adapter has 8 classes');
  const expectedChilliClasses = [
    { index: 0, className: 'Chili__Bacterial_Spot', displayName: 'Chilli Bacterial Spot' },
    { index: 1, className: 'Chili__Cercospora_Leaf_Spot', displayName: 'Chilli Cercospora Leaf Spot' },
    { index: 2, className: 'Chili__Curl_Virus', displayName: 'Chilli Leaf Curl Virus' },
    { index: 3, className: 'Chili__Healthy_Leaf', displayName: 'Healthy Chilli Leaf' },
    { index: 4, className: 'Chili__Nutrition_Deficiency', displayName: 'Chilli Nutrient Deficiency' },
    { index: 5, className: 'Others', displayName: 'Other / Unidentified Leaf' },
    { index: 6, className: 'Chili__Powdery_Mildew', displayName: 'Chilli Powdery Mildew' },
    { index: 7, className: 'Chili__White_Spot', displayName: 'Chilli Anthracnose / White Spot' }
  ];

  for (const exp of expectedChilliClasses) {
    const entry = chilliAdapter.supportedClasses[exp.index];
    assert(entry.className === exp.className, `Chilli index ${exp.index} className is ${exp.className}`);
    assert(entry.displayName === exp.displayName, `Chilli index ${exp.index} displayName is ${exp.displayName}`);
    const disease = chilliAdapter.mapClassIndexToDisease(exp.index);
    assert(disease !== undefined && disease.name.length > 0, `Chilli index ${exp.index} maps to knowledge base disease: ${disease.name}`);
  }

  // Tomato Mapping
  const tomatoAdapter = new TomatoClassifierAdapter();
  assert(tomatoAdapter.supportedClasses.length === 10, 'Tomato adapter has 10 classes');
  assert(tomatoAdapter.supportedClasses[0].className === 'Tomato___Bacterial_spot', 'Tomato class 0 is Bacterial Spot');
  assert(tomatoAdapter.supportedClasses[9].className === 'Tomato___healthy', 'Tomato class 9 is Healthy Tomato Leaf');

  console.log('');

  // --------------------------------------------------------------------------
  // SECTION 5: Routing, Safety & Silent Fallback Blocking
  // --------------------------------------------------------------------------
  console.log('--- 5. MODEL ROUTING & ISOLATION SAFETY ---');

  assert(potatoAdapter.expectedModelPath === '/models/potato_disease.onnx', 'Potato adapter targets /models/potato_disease.onnx');
  assert(chilliAdapter.expectedModelPath === '/models/chilli_disease.onnx', 'Chilli adapter targets /models/chilli_disease.onnx');

  // Verify non-installed models throw CropModelUnavailableError
  let riceBlocked = false;
  try {
    const rice = new RiceClassifierAdapter();
    await rice.classify();
  } catch (err: any) {
    if (err instanceof CropModelUnavailableError) riceBlocked = true;
  }
  assert(riceBlocked, 'Rice classifier strictly BLOCKS execution with CropModelUnavailableError');

  let bananaBlocked = false;
  try {
    const banana = new BananaClassifierAdapter();
    await banana.classify();
  } catch (err: any) {
    if (err instanceof CropModelUnavailableError) bananaBlocked = true;
  }
  assert(bananaBlocked, 'Banana classifier strictly BLOCKS execution with CropModelUnavailableError');

  console.log('\n================================================================');
  console.log(`   ALL MULTI-CROP ONNX INFERENCE CHECKS PASSED: ${passed} / ${passed + failed}`);
  console.log('================================================================\n');
}

runMultiCropInferenceTests().catch((err) => {
  console.error('\nMulti-crop test suite failed:', err);
  process.exit(1);
});
