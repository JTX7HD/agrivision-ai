import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  parseDataUrl,
  computeSha256,
  persistImage,
  findCorrectionByHash,
  saveCorrectionRecord,
  getAllCorrections,
  getStorageDiagnostics,
  type StoredCorrection
} from '../_lib/storage.ts';

const VALID_TOMATO_CLASSES = [
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites Two-spotted_spider_mite',
  'Tomato___Target_Spot',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
  'Tomato___Tomato_mosaic_virus',
  'Tomato___healthy'
];

const VALID_POTATO_CLASSES = [
  'Potato__Early_Blight',
  'Potato__Healthy_Leaf',
  'Potato__Late_Blight'
];

const VALID_CHILLI_CLASSES = [
  'Chili__Bacterial_Spot',
  'Chili__Cercospora_Leaf_Spot',
  'Chili__Curl_Virus',
  'Chili__Healthy_Leaf',
  'Chili__Nutrition_Deficiency',
  'Others',
  'Chili__Powdery_Mildew',
  'Chili__White_Spot'
];

const VALID_CLASSES_BY_CROP: Record<string, string[]> = {
  tomato: VALID_TOMATO_CLASSES,
  potato: VALID_POTATO_CLASSES,
  chilli: VALID_CHILLI_CLASSES,
  pepper: VALID_CHILLI_CLASSES
};

const ALL_VALID_CLASSES = [
  ...VALID_TOMATO_CLASSES,
  ...VALID_POTATO_CLASSES,
  ...VALID_CHILLI_CLASSES
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-training-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // GET: Retrieve corrections & summary statistics
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const corrections = await getAllCorrections();
      const diagnostics = getStorageDiagnostics();

      const classBreakdown: Record<string, number> = {};
      ALL_VALID_CLASSES.forEach((c) => {
        classBreakdown[c] = 0;
      });

      let approvedCount = 0;
      let untrainedCount = 0;

      corrections.forEach((c: StoredCorrection) => {
        if (classBreakdown[c.corrected_class_name] !== undefined) {
          classBreakdown[c.corrected_class_name] += 1;
        } else {
          classBreakdown[c.corrected_class_name] = 1;
        }

        if (c.status === 'approved') approvedCount++;
        if (c.status === 'approved' || c.status === 'pending') untrainedCount++;
      });

      return res.status(200).json({
        success: true,
        total: corrections.length,
        approvedCount,
        untrainedCount,
        classBreakdown,
        diagnostics,
        corrections: corrections.slice(0, 50) // Latest 50
      });
    } catch (err) {
      console.error('Failed to query corrections:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve corrections dataset.',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // -------------------------------------------------------------
  // POST: Save a new correction
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        imageDataUrl,
        correctedClassIndex,
        correctedClassName,
        predictedClassIndex,
        predictedClassName,
        confidence,
        modelVersion = '2.0.0-ONNX',
        modelCheckpoint = 'best_tomato_mobilenetv3_v2.pth',
        cropId = 'tomato',
        yoloBox,
        notes
      } = body || {};

      // 1. Validate payload
      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: imageDataUrl.'
        });
      }

      const normalizedCropId = (cropId || 'tomato').toLowerCase();
      const validClasses = VALID_CLASSES_BY_CROP[normalizedCropId] || VALID_TOMATO_CLASSES;

      if (
        typeof correctedClassIndex !== 'number' ||
        correctedClassIndex < 0 ||
        correctedClassIndex >= validClasses.length
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid correctedClassIndex: ${correctedClassIndex}. Must be integer between 0 and ${validClasses.length - 1} for crop '${normalizedCropId}'.`
        });
      }

      if (!validClasses.includes(correctedClassName)) {
        return res.status(400).json({
          success: false,
          error: `Invalid correctedClassName: "${correctedClassName}". Must match one of the ${validClasses.length} known classes for crop '${normalizedCropId}'.`
        });
      }

      // 2. Decode image and compute SHA-256 hash
      const { buffer, mimeType } = parseDataUrl(imageDataUrl);
      if (buffer.length < 100) {
        return res.status(400).json({
          success: false,
          error: 'Image data is invalid or corrupted (too small).'
        });
      }

      const imageHash = computeSha256(buffer);

      // 3. Prevent duplicate submissions
      const existing = await findCorrectionByHash(imageHash);
      if (existing) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          error: `Duplicate submission: This exact image was already submitted as "${existing.corrected_class_name}" on ${new Date(existing.created_at).toLocaleDateString()}. Duplicate submissions are prevented.`,
          existingRecord: existing
        });
      }

      // 4. Persist image to local data/corrections/images/ (or Vercel Blob)
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('bmp') ? 'bmp' : mimeType.includes('webp') ? 'webp' : 'jpg';
      const filename = `${normalizedCropId}_${correctedClassName}_${Date.now()}_${imageHash.slice(0, 8)}.${ext}`;
      const { url: persistedImageUrl, relativePath, provider } = await persistImage(buffer, filename, mimeType);

      // 5. Persist metadata to Supabase (or dev fallback)
      const record = await saveCorrectionRecord({
        image_url: persistedImageUrl,
        image_path: relativePath,
        original_image_hash: imageHash,
        sha256: imageHash,
        corrected_class_index: correctedClassIndex,
        corrected_class_name: correctedClassName,
        predicted_class_index: typeof predictedClassIndex === 'number' ? predictedClassIndex : -1,
        predicted_class_name: predictedClassName || 'Unknown',
        confidence: typeof confidence === 'number' ? Number(confidence.toFixed(2)) : 0,
        predicted_confidence: typeof confidence === 'number' ? Number(confidence.toFixed(2)) : 0,
        model_version: modelVersion,
        model_checkpoint: modelCheckpoint,
        crop_id: cropId,
        yolo_box: yoloBox,
        notes: notes ? String(notes).trim().slice(0, 500) : undefined,
        training_status: 'approved',
        status: 'approved',
        storage_provider: provider === 'vercel-blob' ? 'vercel-blob+supabase' : 'local-filesystem'
      });

      const diagnostics = getStorageDiagnostics();

      return res.status(201).json({
        success: true,
        message: 'Correction successfully saved to dataset.',
        record,
        diagnostics
      });
    } catch (err) {
      console.error('Error saving correction:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to save correction.',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
