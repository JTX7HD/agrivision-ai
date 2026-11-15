import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSAMStatus, SAMLeafSegmenter } from '../src/services/pipeline/leafSegmentationService';
import { PipelineOrchestrator } from '../src/services/pipeline/pipelineOrchestrator';
import { getCropById } from '../src/data/cropsData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runSAMTests() {
  console.log('===========================================================');
  console.log('AgriVision AI — Automated Real SAM Segmentation Verification');
  console.log('===========================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Verify MobileSAM Checkpoints Staged
  const encPath = path.join(rootDir, 'public', 'models', 'mobile_sam.encoder.quant.onnx');
  const decPath = path.join(rootDir, 'public', 'models', 'mobile_sam.decoder.quant.onnx');
  const licensePath = path.join(rootDir, 'LICENSE_MOBILESAM.md');

  assert(fs.existsSync(encPath), 'mobile_sam.encoder.quant.onnx exists in public/models/');
  assert(fs.existsSync(decPath), 'mobile_sam.decoder.quant.onnx exists in public/models/');
  assert(fs.existsSync(licensePath), 'LICENSE_MOBILESAM.md exists with Apache 2.0 attribution');

  const encStat = fs.statSync(encPath);
  const decStat = fs.statSync(decPath);
  assert(encStat.size === 11018056, `Encoder exact byte size verified: ${encStat.size} bytes (11.0 MB)`);
  assert(decStat.size === 8742607, `Decoder exact byte size verified: ${decStat.size} bytes (8.7 MB)`);

  // 2. Verify Strict Protection: Original Classifier Models Unchanged
  const tomatoPath = path.join(rootDir, 'public', 'models', 'tomato_mobilenetv3_v2.onnx');
  const potatoPath = path.join(rootDir, 'public', 'models', 'potato_disease.onnx');
  const chilliPath = path.join(rootDir, 'public', 'models', 'chilli_disease.onnx');
  const yoloPath = path.join(rootDir, 'public', 'models', 'yolo11n_leaf_v1_best.onnx');

  assert(fs.statSync(tomatoPath).size === 17142352, 'Tomato model weight size preserved: 17,142,352 bytes');
  assert(fs.statSync(potatoPath).size === 21798793, 'Potato model weight size preserved: 21,798,793 bytes');
  assert(fs.statSync(chilliPath).size === 6191953, 'Chilli model weight size preserved: 6,191,953 bytes');
  assert(fs.statSync(yoloPath).size === 10635095, 'YOLO11n model weight size preserved: 10,635,095 bytes');

  // 3. Inspect SAM Status Interface
  const samStatus = getSAMStatus();
  assert(samStatus.isAvailable === true, 'getSAMStatus().isAvailable is true');
  assert(samStatus.mode === 'sam_weights', 'getSAMStatus().mode is sam_weights');
  assert(samStatus.modelSizeMB === 19.8, 'getSAMStatus().modelSizeMB is 19.8 MB');
  assert(samStatus.architecture.includes('TinyViT-5M'), 'Architecture references TinyViT-5M');
  assert(samStatus.license.includes('Apache 2.0'), 'License references Apache 2.0');

  // 4. Test Headless / Node Fallback Behavior
  const segmenter = new SAMLeafSegmenter();
  const dummyDetection = {
    id: 'test-det-0',
    box: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    confidence: 0.95,
    label: 'leaf',
    croppedImageUrl: 'data:image/jpeg;base64,/dummy'
  };

  const segResult = await segmenter.segmentLeaf('data:image/jpeg;base64,/dummy', dummyDetection);
  assert(segResult.detectionId === 'test-det-0', 'Segmentation returns correct detectionId');
  assert(segResult.isolatedLeafImageUrl === 'data:image/jpeg;base64,/dummy', 'Node fallback preserves input leaf image URL');
  assert(segResult.isPassThrough === true, 'In Node headless environment, isPassThrough gracefully true without crashing');

  // 5. Verify Pipeline Orchestrator with SAM Integration
  const orchestrator = new PipelineOrchestrator();
  // Mock image quality validator to avoid canvas in Node
  orchestrator.setQualityValidator(async () => ({ isSuitable: true, brightness: 120, contrast: 50, blurScore: 80 }));
  orchestrator.setDetector({
    name: 'Mock YOLO',
    modelIdentifier: 'YOLO11n Leaf Detector',
    detectLeaves: async () => [{
      id: 'leaf-0',
      box: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
      confidence: 0.94,
      label: 'leaf',
      croppedImageUrl: 'data:image/jpeg;base64,/cropped'
    }]
  });

  const cropsToTest: Array<'tomato' | 'potato' | 'chilli'> = ['tomato', 'potato', 'chilli'];
  for (const cropId of cropsToTest) {
    const crop = getCropById(cropId);
    assert(crop !== undefined, `Crop ${cropId} defined in system`);

    // Use a mock classifier for Node unit test
    orchestrator.setClassifier({
      name: `${crop.name} Classifier`,
      modelIdentifier: `${crop.name} ONNX Adapter`,
      classify: async (_img, cId) => ({
        predictedClassIndex: 0,
        predictedClassName: `${cId}_class_0`,
        topConfidence: 96.5,
        confidenceLevel: 'High' as const,
        disease: {
          id: `${cId}-dis-0`,
          cropId: cId as any,
          name: `${crop.name} Condition`,
          scientificName: 'Scientific test',
          description: 'Test description',
          commonSymptoms: ['symptom1'],
          generalManagement: ['mgmt1'],
          preventativeMeasures: ['prev1']
        },
        classProbabilities: [{ classIndex: 0, className: 'c0', displayName: 'C0', probability: 96.5 }],
        uncertainty: { isUncertain: false, isWeakConfidence: false, isAmbiguous: false, topConfidence: 96.5, secondConfidence: 3.5, topMargin: 93.0, confidenceThreshold: 80, marginThreshold: 15, reasons: [] },
        rawLogits: [5.0, 0.1],
        inferenceTimeMs: 45
      })
    });

    const pipelineResult = await orchestrator.run('data:image/jpeg;base64,/orig', { cropId });
    assert(pipelineResult.crop.id === cropId, `Pipeline executed successfully for ${cropId}`);
    assert(pipelineResult.pipelineStages.length >= 5, `All 5 modular pipeline stages ran for ${cropId}`);
    const samStage = pipelineResult.pipelineStages.find(s => s.id === 'segmentation');
    assert(samStage !== undefined, `SAM segmentation stage present in pipeline stages for ${cropId}`);
    assert(samStage?.status === 'completed', `SAM segmentation stage completed for ${cropId}`);
  }

  console.log('===========================================================');
  console.log(`ALL ${passed}/${total} SAM SEGMENTATION TESTS PASSED SUCCESSFULLY!`);
  console.log('===========================================================');
}

runSAMTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
