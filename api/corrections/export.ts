import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllCorrections, getStorageDiagnostics, type StoredCorrection } from '../_lib/storage.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }

  try {
    const format = (req.query.format as string) || 'json';
    const statusFilter = (req.query.status as string) || 'approved';
    const all = await getAllCorrections();

    // Filter by status if specified (default: approved corrections)
    const filtered = statusFilter === 'all' ? all : all.filter((c: StoredCorrection) => c.status === statusFilter || c.status === 'trained');

    // ---------------------------------------------------------
    // 1. CSV Format
    // ---------------------------------------------------------
    if (format === 'csv') {
      const headers = [
        'id',
        'crop_id',
        'timestamp',
        'created_at',
        'sha256',
        'image_path',
        'image_url',
        'corrected_class_index',
        'corrected_class_name',
        'predicted_class_index',
        'predicted_class_name',
        'confidence',
        'model_version',
        'model_checkpoint',
        'training_status',
        'status',
        'notes'
      ];

      const csvRows = [headers.join(',')];

      filtered.forEach((r: StoredCorrection) => {
        const row = [
          JSON.stringify(r.id),
          JSON.stringify(r.crop_id || 'tomato'),
          JSON.stringify(r.timestamp || r.created_at),
          JSON.stringify(r.created_at),
          JSON.stringify(r.sha256 || r.original_image_hash),
          JSON.stringify(r.image_path || ''),
          JSON.stringify(r.image_url),
          r.corrected_class_index,
          JSON.stringify(r.corrected_class_name),
          r.predicted_class_index,
          JSON.stringify(r.predicted_class_name),
          r.confidence,
          JSON.stringify(r.model_version),
          JSON.stringify(r.model_checkpoint),
          JSON.stringify(r.training_status || r.status),
          JSON.stringify(r.status),
          JSON.stringify(r.notes || '')
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="agrivision_corrections_${Date.now()}.csv"`
      );
      return res.status(200).send(csvContent);
    }

    // ---------------------------------------------------------
    // 2. PyTorch Training Manifest / JSON Format
    // ---------------------------------------------------------
    const diagnostics = getStorageDiagnostics();
    const classCounts: Record<string, number> = {};

    filtered.forEach((item: StoredCorrection) => {
      classCounts[item.corrected_class_name] =
        (classCounts[item.corrected_class_name] || 0) + 1;
    });

    const exportManifest = {
      datasetName: 'AgriVision-AI-Tomato-Correction-Dataset',
      exportedAt: new Date().toISOString(),
      totalCorrections: filtered.length,
      statusFilter,
      classes: Object.keys(classCounts).map((className) => ({
        className,
        sampleCount: classCounts[className]
      })),
      diagnostics,
      samples: filtered.map((item: StoredCorrection) => ({
        id: item.id,
        cropId: item.crop_id || 'tomato',
        crop_id: item.crop_id || 'tomato',
        createdAt: item.created_at,
        timestamp: item.timestamp || item.created_at,
        imageUrl: item.image_url,
        imagePath: item.image_path,
        image_path: item.image_path,
        imageHash: item.original_image_hash,
        sha256: item.sha256 || item.original_image_hash,
        corrected_class_index: item.corrected_class_index,
        corrected_class_name: item.corrected_class_name,
        predicted_class_index: item.predicted_class_index,
        predicted_class_name: item.predicted_class_name,
        label: {
          classIndex: item.corrected_class_index,
          className: item.corrected_class_name
        },
        originalPrediction: {
          classIndex: item.predicted_class_index,
          className: item.predicted_class_name,
          confidence: item.confidence
        },
        confidence: item.confidence,
        predictedConfidence: item.predicted_confidence ?? item.confidence,
        modelVersion: item.model_version,
        modelCheckpoint: item.model_checkpoint,
        yoloBox: item.yolo_box,
        notes: item.notes,
        trainingStatus: item.training_status || item.status,
        status: item.status
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="agrivision_corrections_${Date.now()}.json"`
    );
    return res.status(200).json(exportManifest);
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to export corrections dataset.',
      details: err instanceof Error ? err.message : String(err)
    });
  }
}
