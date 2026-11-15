/**
 * AgriVision AI — Segmentation Feasibility Runner (TypeScript / Node Engine)
 * =========================================================================
 * Executes scripts/evaluate_segmentation.py, independently checks cryptographic
 * hashes via Node crypto, and validates saved evaluation artifacts.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const MODEL_PATH = path.join(REPO_ROOT, 'public', 'models', 'tomato_mobilenetv3_v2.onnx');
const YOLO_MODEL_PATH = path.join(REPO_ROOT, 'public', 'models', 'yolo11n_leaf_v1_best.onnx');
const MANIFEST_PATH = path.join(REPO_ROOT, 'data', 'benchmark', 'benchmark_manifest.json');
const RESULTS_DIR = path.join(REPO_ROOT, 'data', 'benchmark', 'results');
const SUMMARY_FILE = path.join(RESULTS_DIR, 'segmentation_comparison.json');
const PER_IMAGE_FILE = path.join(RESULTS_DIR, 'segmentation_per_image.json');

function computeFileSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export async function runSegmentationEvaluation(): Promise<any> {
  console.log('='.repeat(85));
  console.log('AGRIVISION AI -- SEGMENTATION EVALUATION RUNNER (TypeScript / Node Engine)');
  console.log('='.repeat(85));

  // Step 1: Pre-execution Hash Verification
  console.log('\n[1/4] Pre-execution Cryptographic Hash Integrity Verification:');
  const preTomatoHash = computeFileSha256(MODEL_PATH);
  const preYoloHash = computeFileSha256(YOLO_MODEL_PATH);
  const preManifestHash = computeFileSha256(MANIFEST_PATH);

  console.log(`  - tomato_mobilenetv3_v2.onnx : ${preTomatoHash}`);
  console.log(`  - yolo11n_leaf_v1_best.onnx   : ${preYoloHash}`);
  console.log(`  - benchmark_manifest.json     : ${preManifestHash}`);

  // Step 2: Execute Segmentation Evaluator
  console.log('\n[2/4] Executing Segmentation Evaluator...');
  const pythonScript = path.join(__dirname, 'evaluate_segmentation.py');

  let execResult = spawnSync('py', [pythonScript], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: 'inherit'
  });

  if (execResult.error || execResult.status !== 0) {
    execResult = spawnSync('python', [pythonScript], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: 'inherit'
    });
  }

  if (execResult.status !== 0) {
    throw new Error(`Segmentation evaluation script exited with non-zero code: ${execResult.status}`);
  }

  // Step 3: Post-execution Hash Verification
  console.log('\n[3/4] Post-execution Independent Hash Verification (Node crypto):');
  const postTomatoHash = computeFileSha256(MODEL_PATH);
  const postYoloHash = computeFileSha256(YOLO_MODEL_PATH);
  const postManifestHash = computeFileSha256(MANIFEST_PATH);

  if (preTomatoHash !== postTomatoHash) {
    throw new Error('CRITICAL INTEGRITY FAILURE: tomato ONNX model hash changed!');
  }
  if (preYoloHash !== postYoloHash) {
    throw new Error('CRITICAL INTEGRITY FAILURE: YOLO ONNX model hash changed!');
  }
  if (preManifestHash !== postManifestHash) {
    throw new Error('CRITICAL INTEGRITY FAILURE: benchmark manifest hash changed!');
  }
  console.log('  [PASS] All model weights and benchmark files confirmed bitwise unchanged.');

  // Step 4: Validate Output Artifacts
  console.log('\n[4/4] Validating Saved Segmentation Artifacts:');
  if (!fs.existsSync(SUMMARY_FILE) || !fs.existsSync(PER_IMAGE_FILE)) {
    throw new Error('Expected output artifacts were not created in data/benchmark/results/');
  }

  const summary = JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf-8'));
  const perImage = JSON.parse(fs.readFileSync(PER_IMAGE_FILE, 'utf-8'));

  console.log(`  - segmentation_comparison.json size: ${fs.statSync(SUMMARY_FILE).size} bytes`);
  console.log(`  - segmentation_per_image.json size: ${fs.statSync(PER_IMAGE_FILE).size} bytes (${perImage.length} records)`);
  console.log('\n[COMPLETED] Segmentation evaluation finished successfully.');

  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runSegmentationEvaluation().catch((err) => {
    console.error('Segmentation runner failed:', err);
    process.exit(1);
  });
}
