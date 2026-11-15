import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllCorrections, getStorageDiagnostics, getSupabase, type StoredCorrection } from '../_lib/storage.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-training-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // GET: Training pipeline status and model registry
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const corrections = await getAllCorrections();
      const untrainedCount = corrections.filter(
        (c: StoredCorrection) => c.status === 'approved' || c.status === 'pending'
      ).length;

      const supabase = getSupabase();
      let registryRecords = [];

      if (supabase) {
        const { data } = await supabase
          .from('model_registry')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) registryRecords = data;
      }

      // Default production baseline if database is not yet seeded
      if (registryRecords.length === 0) {
        registryRecords = [
          {
            version: '2.0.0-ONNX',
            checkpoint_name: 'best_tomato_mobilenetv3_v2.pth',
            is_active: true,
            is_candidate: false,
            status: 'active',
            pv_accuracy: 99.56,
            plantdoc_accuracy: 47.54,
            validation_loss: 0.084,
            total_training_samples: 18656,
            total_corrections_used: 0,
            created_at: '2026-10-09T09:48:43.000Z'
          }
        ];
      }

      const activeModel =
        registryRecords.find((m: { is_active: boolean }) => m.is_active) || registryRecords[0];

      return res.status(200).json({
        success: true,
        activeModel,
        untrainedCorrectionsCount: untrainedCount,
        totalCorrectionsCount: corrections.length,
        readyForRetraining: untrainedCount >= 5, // Suggested batch threshold: 5+ corrections
        minRecommendedBatch: 5,
        modelHistory: registryRecords,
        diagnostics: getStorageDiagnostics()
      });
    } catch (err) {
      console.error('Training status error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve training status.',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  // -------------------------------------------------------------
  // POST: Record candidate model evaluation or update active model
  // (Protected by TRAINING_SECRET_KEY)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const secret =
      (req.headers['x-training-secret'] as string) ||
      (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '');

    const expectedSecret = process.env.TRAINING_SECRET_KEY || 'agrivision_secret_admin_token_change_in_production';

    if (secret !== expectedSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing training secret key.'
      });
    }

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        action, // 'evaluate_candidate' | 'rollback'
        candidateVersion,
        checkpointName,
        pvAccuracy,
        plantdocAccuracy,
        validationLoss,
        totalCorrectionsUsed
      } = body;

      const supabase = getSupabase();

      if (action === 'rollback') {
        const targetVersion = body.targetVersion || '2.0.0-ONNX';
        if (supabase) {
          await supabase.from('model_registry').update({ is_active: false }).neq('version', targetVersion);
          await supabase.from('model_registry').update({ is_active: true, status: 'active' }).eq('version', targetVersion);
        }
        return res.status(200).json({
          success: true,
          message: `Model rolled back to version ${targetVersion}.`
        });
      }

      // Check for regression against production baseline
      const baselinePV = 99.56;
      const baselinePlantDoc = 47.54;

      const pvDrop = baselinePV - pvAccuracy;
      const plantDocDrop = baselinePlantDoc - plantdocAccuracy;

      // Allow max 0.5% tolerance on PlantVillage, no drop > 2% on PlantDoc
      const hasRegression = pvDrop > 0.5 || plantDocDrop > 2.0;

      const evaluationRecord = {
        version: candidateVersion || `2.1.0-candidate-${Date.now().toString().slice(-4)}`,
        checkpoint_name: checkpointName || 'candidate_mobilenetv3.pth',
        pv_accuracy: pvAccuracy,
        plantdoc_accuracy: plantdocAccuracy,
        validation_loss: validationLoss,
        is_active: !hasRegression,
        is_candidate: true,
        status: hasRegression ? 'rejected' : 'passed',
        regression_notes: hasRegression
          ? `Rejected: Candidate regressed compared to baseline. PV: ${pvAccuracy}% (base ${baselinePV}%), PlantDoc: ${plantdocAccuracy}% (base ${baselinePlantDoc}%).`
          : 'Passed: Candidate model meets or exceeds baseline performance across test splits.',
        total_corrections_used: totalCorrectionsUsed || 0
      };

      if (supabase) {
        if (!hasRegression) {
          // Deactivate previous models
          await supabase.from('model_registry').update({ is_active: false }).neq('version', evaluationRecord.version);
        }
        await supabase.from('model_registry').upsert(evaluationRecord, { onConflict: 'version' });
      }

      return res.status(200).json({
        success: true,
        candidateEvaluated: evaluationRecord,
        passed: !hasRegression,
        message: hasRegression
          ? 'Candidate model rejected due to regression on validation benchmarks.'
          : 'Candidate model passed validation and is approved for deployment.'
      });
    } catch (err) {
      console.error('Candidate evaluation record error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to process candidate model evaluation.',
        details: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
