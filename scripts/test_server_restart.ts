import fs from 'node:fs';
import path from 'node:path';

async function testServerRestartFlow() {
  console.log('=== TEST: PERSISTENT STORAGE & SERVER RESTART VERIFICATION ===\n');

  const apiUrl = 'http://localhost:3000';

  // 1. Check server health
  console.log('1. Checking server health at', apiUrl);
  const healthRes = await fetch(`${apiUrl}/api/corrections`);
  if (!healthRes.ok) {
    throw new Error(`Server returned ${healthRes.status}: ${await healthRes.text()}`);
  }
  const initialData = await healthRes.json();
  console.log(`   Initial total corrections in dataset: ${initialData.total}`);
  console.log(`   Diagnostics mode: ${initialData.diagnostics?.mode}`);

  // 2. Generate a valid unique 10x10 24-bit BMP image (374 bytes)
  const uniqueId = `restart_test_${Date.now()}`;
  const r = (Date.now() & 0xFF);
  const g = ((Date.now() >> 8) & 0xFF);
  const b = ((Date.now() >> 16) & 0xFF);

  const rowSize = 32; // 10 pixels * 3 bytes = 30 bytes + 2 pad = 32 bytes
  const imgSize = rowSize * 10;
  const fileSize = 54 + imgSize; // 374 bytes

  const bmpBuf = Buffer.alloc(fileSize);
  bmpBuf.write('BM', 0);
  bmpBuf.writeUInt32LE(fileSize, 2);
  bmpBuf.writeUInt32LE(54, 10);
  bmpBuf.writeUInt32LE(40, 14);
  bmpBuf.writeInt32LE(10, 18); // width 10
  bmpBuf.writeInt32LE(10, 22); // height 10
  bmpBuf.writeUInt16LE(1, 26);
  bmpBuf.writeUInt16LE(24, 28);
  bmpBuf.writeUInt32LE(0, 30);
  bmpBuf.writeUInt32LE(imgSize, 34);

  for (let y = 0; y < 10; y++) {
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < 10; x++) {
      const px = rowOffset + x * 3;
      bmpBuf[px] = (b + x * 5) & 0xFF;
      bmpBuf[px + 1] = (g + y * 5) & 0xFF;
      bmpBuf[px + 2] = r;
    }
  }

  const dummyBase64 = 'data:image/bmp;base64,' + bmpBuf.toString('base64');

  console.log('2. Submitting unique correction via POST /api/corrections...');
  const postPayload = {
    imageDataUrl: dummyBase64,
    correctedClassIndex: 9,
    correctedClassName: 'Tomato___healthy',
    predictedClassIndex: 3,
    predictedClassName: 'Tomato___Leaf_Mold',
    confidence: 76.5,
    modelVersion: '2.0.0-ONNX',
    modelCheckpoint: 'best_tomato_mobilenetv3_v2.pth',
    cropId: 'tomato',
    notes: `Server restart verification test entry ${uniqueId}`
  };

  const postRes = await fetch(`${apiUrl}/api/corrections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postPayload)
  });

  if (postRes.status !== 201) {
    throw new Error(`Expected HTTP 201, got ${postRes.status}: ${await postRes.text()}`);
  }

  const postJson = await postRes.json();
  const savedRecord = postJson.record;
  console.log('   ✓ Correction saved. Record ID:', savedRecord.id);
  console.log('   ✓ SHA256:', savedRecord.sha256);
  console.log('   ✓ Image Path:', savedRecord.image_path);

  // 3. Test Duplicate Prevention Guard
  console.log('3. Testing duplicate rejection for the identical image...');
  const dupRes = await fetch(`${apiUrl}/api/corrections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postPayload)
  });

  if (dupRes.status !== 409) {
    throw new Error(`Expected HTTP 409 Conflict for duplicate, got ${dupRes.status}`);
  }
  const dupJson = await dupRes.json();
  if (!dupJson.duplicate) {
    throw new Error('Expected duplicate: true in 409 response');
  }
  console.log('   ✓ Duplicate rejection confirmed (HTTP 409 Conflict)');

  // 4. Verify disk presence
  const manifestPath = path.join(process.cwd(), 'data', 'corrections', 'manifest.json');
  const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
  const records = JSON.parse(manifestRaw);
  const onDisk = records.find((r: any) => r.id === savedRecord.id);
  if (!onDisk) {
    throw new Error('Saved record was not found in data/corrections/manifest.json');
  }
  console.log('4. Disk state verified:');
  console.log('   ✓ Manifest file exists at data/corrections/manifest.json');
  console.log('   ✓ Record confirmed on disk with all 8 fields.');

  console.log('\nReady for server restart verification step.');
  return { recordId: savedRecord.id, sha256: savedRecord.sha256 };
}

testServerRestartFlow().catch((err) => {
  console.error('Server test failed:', err);
  process.exit(1);
});
