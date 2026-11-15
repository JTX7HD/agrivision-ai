import fs from 'node:fs';
import path from 'node:path';

async function verifyRestart() {
  console.log('=== VERIFYING PERSISTENCE AFTER SERVER RESTART ===\n');

  const apiUrl = 'http://localhost:3000';

  console.log('1. Querying GET /api/corrections from restarted server...');
  const res = await fetch(`${apiUrl}/api/corrections`);
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  console.log(`   Total corrections reported by server: ${data.total}`);

  // Also query the export endpoint
  console.log('2. Querying GET /api/corrections/export from restarted server...');
  const exportRes = await fetch(`${apiUrl}/api/corrections/export?format=json&status=all`);
  if (!exportRes.ok) {
    throw new Error(`Export API returned HTTP ${exportRes.status}`);
  }
  const exportData = await exportRes.json();
  console.log(`   Export total samples: ${exportData.totalCorrections}`);

  // Read manifest.json directly
  const manifestPath = path.join(process.cwd(), 'data', 'corrections', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}`);
  }
  const manifestList = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`3. Verified data/corrections/manifest.json contains ${manifestList.length} records.`);

  if (manifestList.length === 0) {
    throw new Error('Manifest is empty!');
  }

  const latest = manifestList[0];
  console.log('4. Latest Record on Disk:');
  console.log('   - ID:', latest.id);
  console.log('   - Timestamp:', latest.timestamp);
  console.log('   - SHA256:', latest.sha256);
  console.log('   - Corrected Label:', latest.corrected_class_name, `(#${latest.corrected_class_index})`);
  console.log('   - Predicted Label:', latest.predicted_class_name, `(#${latest.predicted_class_index})`);
  console.log('   - Confidence:', latest.confidence);
  console.log('   - Model Version:', latest.model_version);
  console.log('   - Training Status:', latest.training_status);
  console.log('   - Image Path:', latest.image_path);

  // Check physical file
  const fullImagePath = path.join(process.cwd(), latest.image_path);
  if (!fs.existsSync(fullImagePath)) {
    throw new Error(`Image file does not exist on disk: ${fullImagePath}`);
  }
  const stats = fs.statSync(fullImagePath);
  console.log(`   - Image File Size on Disk: ${stats.size} bytes`);
  console.log('   ✓ Physical image file preserved on disk');

  console.log('\n=== SERVER RESTART PERSISTENCE VERIFICATION PASSED ===');
}

verifyRestart().catch((err) => {
  console.error('Restart verification failed:', err);
  process.exit(1);
});
