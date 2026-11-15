import fs from 'node:fs';
import path from 'node:path';
import {
  parseDataUrl,
  computeSha256,
  persistImage,
  findCorrectionByHash,
  saveCorrectionRecord,
  getAllCorrections,
  getStorageDiagnostics
} from '../api/_lib/storage.ts';

async function runTests() {
  console.log('=== AGRIVISION AI: DIRECT CORRECTION LEARNING VERIFICATION ===\n');

  // Test 1: Storage Diagnostics & Location
  const diagnostics = getStorageDiagnostics();
  console.log('1. Storage Diagnostics:');
  console.log('   - Mode:', diagnostics.mode);
  console.log('   - Is Persistent:', diagnostics.isPersistent);
  console.log('   - Manifest Location:', diagnostics.localStorageLocation.manifest);
  console.log('   - Images Location:', diagnostics.localStorageLocation.images);
  console.log('   - Has Vercel Blob Token:', diagnostics.hasBlobToken);
  console.log('   - Has Supabase URL:', diagnostics.hasSupabaseUrl);
  console.log('   - Has Supabase Key:', diagnostics.hasSupabaseKey);
  console.log('   - Missing credentials for cloud:', diagnostics.missingCredentials.join(', ') || 'None (Fully configured)');
  if (diagnostics.mode !== 'local-persistent' && !diagnostics.isCloudConfigured) {
    throw new Error(`Unexpected storage mode in local test environment: ${diagnostics.mode}`);
  }
  console.log('   ✓ Diagnostics verified\n');

  // Test 2: Sample Leaf Image & Hashing
  // 10x10 dummy JPEG base64
  const sampleBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const { buffer, mimeType } = parseDataUrl(sampleBase64);
  const hash = computeSha256(buffer);
  console.log('2. Image Processing & SHA-256 Hash:');
  console.log('   - Decoded bytes:', buffer.length);
  console.log('   - Mime type:', mimeType);
  console.log('   - SHA-256 Hash:', hash);
  if (!hash || hash.length !== 64) {
    throw new Error('FAILED: SHA-256 hash length is invalid!');
  }
  console.log('   ✓ SHA-256 hash computed successfully\n');

  // Test 3: Save Correction & Verify 8 Required Fields
  console.log('3. Saving Correction Record & Verifying 8 Required Fields:');
  const filename = `tomato_Tomato___healthy_${Date.now()}_${hash.slice(0, 8)}.jpg`;
  const { url: persistedUrl, relativePath, provider } = await persistImage(buffer, filename, mimeType);
  console.log('   - Persisted Image Provider:', provider);
  console.log('   - Relative File Path:', relativePath);

  // Verify physical image file exists on disk under data/corrections/images/
  const expectedDiskImagePath = path.join(process.cwd(), 'data', 'corrections', 'images', filename);
  if (!fs.existsSync(expectedDiskImagePath)) {
    throw new Error(`FAILED: Image file was not found on disk at: ${expectedDiskImagePath}`);
  }
  console.log('   ✓ Image verified on disk under data/corrections/images/');

  const testPayload = {
    image_url: persistedUrl,
    image_path: relativePath,
    original_image_hash: hash,
    sha256: hash,
    corrected_class_index: 9,
    corrected_class_name: 'Tomato___healthy',
    predicted_class_index: 1,
    predicted_class_name: 'Tomato___Early_blight',
    confidence: 87.4,
    predicted_confidence: 87.4,
    model_version: '2.0.0-ONNX',
    model_checkpoint: 'best_tomato_mobilenetv3_v2.pth',
    crop_id: 'tomato',
    yolo_box: { x: 0.12, y: 0.15, width: 0.76, height: 0.72 },
    notes: 'Verification test: Healthy leaf erroneously marked as early blight',
    training_status: 'approved' as const,
    status: 'approved' as const,
    storage_provider: provider === 'vercel-blob' ? ('vercel-blob+supabase' as const) : ('local-filesystem' as const)
  };

  const savedRecord = await saveCorrectionRecord(testPayload);

  // Explicit verification of the 8 required fields:
  // 1. Original image
  if (!savedRecord.image_url || !savedRecord.image_path) {
    throw new Error('FAILED: Missing original image reference (image_url or image_path)!');
  }
  // 2. Corrected disease label
  if (savedRecord.corrected_class_name !== 'Tomato___healthy' || savedRecord.corrected_class_index !== 9) {
    throw new Error('FAILED: Missing or invalid corrected disease label!');
  }
  // 3. Original prediction
  if (savedRecord.predicted_class_name !== 'Tomato___Early_blight' || savedRecord.predicted_class_index !== 1) {
    throw new Error('FAILED: Missing or invalid original prediction!');
  }
  // 4. Original confidence
  if (typeof savedRecord.confidence !== 'number' || savedRecord.confidence !== 87.4) {
    throw new Error('FAILED: Missing or invalid original confidence!');
  }
  // 5. Model version
  if (!savedRecord.model_version || savedRecord.model_version !== '2.0.0-ONNX') {
    throw new Error('FAILED: Missing or invalid model version!');
  }
  // 6. Timestamp
  if (!savedRecord.timestamp || !savedRecord.created_at) {
    throw new Error('FAILED: Missing timestamp / created_at!');
  }
  // 7. SHA256 hash
  if (savedRecord.sha256 !== hash || savedRecord.original_image_hash !== hash) {
    throw new Error('FAILED: Missing or mismatched SHA256 hash!');
  }
  // 8. Training status
  if (savedRecord.training_status !== 'approved' || savedRecord.status !== 'approved') {
    throw new Error('FAILED: Missing or invalid training status!');
  }

  console.log('   - 1. Original Image:', savedRecord.image_path);
  console.log('   - 2. Corrected Label:', savedRecord.corrected_class_name, `(#${savedRecord.corrected_class_index})`);
  console.log('   - 3. Original Prediction:', savedRecord.predicted_class_name, `(#${savedRecord.predicted_class_index})`);
  console.log('   - 4. Original Confidence:', savedRecord.confidence, '%');
  console.log('   - 5. Model Version:', savedRecord.model_version);
  console.log('   - 6. Timestamp:', savedRecord.timestamp);
  console.log('   - 7. SHA256 Hash:', savedRecord.sha256);
  console.log('   - 8. Training Status:', savedRecord.training_status);
  console.log('   ✓ All 8 required fields verified\n');

  // Test 4: Physical Disk Manifest Check
  console.log('4. Physical Disk Manifest Check:');
  const manifestPath = path.join(process.cwd(), 'data', 'corrections', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`FAILED: Manifest file does not exist at: ${manifestPath}`);
  }
  const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
  const manifestRecords = JSON.parse(manifestRaw);
  const foundInManifest = manifestRecords.find((r: any) => r.sha256 === hash || r.original_image_hash === hash);
  if (!foundInManifest) {
    throw new Error('FAILED: Record was not persisted into data/corrections/manifest.json!');
  }
  console.log(`   - Manifest contains ${manifestRecords.length} records on disk`);
  console.log('   ✓ Direct file read from data/corrections/manifest.json confirmed\n');

  // Test 5: Duplicate Detection Guard
  console.log('5. Duplicate Detection Guard:');
  const duplicate = await findCorrectionByHash(hash);
  if (!duplicate) {
    throw new Error('FAILED: Duplicate record was not found by hash!');
  }
  console.log('   - Duplicate successfully caught by image hash!');
  console.log('   - Matches Record ID:', duplicate.id);
  console.log('   ✓ Duplicate prevention verified\n');

  // Test 6: Query & Retrieval
  console.log('6. Dataset Retrieval:');
  const allCorrections = await getAllCorrections();
  console.log('   - Total corrections in dataset:', allCorrections.length);
  const found = allCorrections.find((c) => c.original_image_hash === hash);
  if (!found) {
    throw new Error('FAILED: Saved correction not returned in getAllCorrections!');
  }
  console.log('   - Verified retrieval of record ID:', found.id);
  console.log('   ✓ Retrieval verified\n');

  console.log('=== ALL PHASE 1 STORAGE CHECKS PASSED ===');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
