import React, { useState, useEffect } from 'react';
import {
  Cpu, Database, Download, RotateCcw,
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  ExternalLink, Layers, Play
} from 'lucide-react';
import { downloadDatasetExport } from '../../services/correctionService';

interface TrainingStatusData {
  activeModel: {
    version: string;
    checkpoint_name: string;
    is_active: boolean;
    pv_accuracy: number;
    plantdoc_accuracy: number;
    total_training_samples?: number;
    total_corrections_used?: number;
  };
  untrainedCorrectionsCount: number;
  totalCorrectionsCount: number;
  readyForRetraining: boolean;
  minRecommendedBatch: number;
  modelHistory: Array<{
    version: string;
    checkpoint_name: string;
    pv_accuracy: number;
    plantdoc_accuracy: number;
    is_active: boolean;
    status: string;
    regression_notes?: string;
    created_at?: string;
  }>;
  diagnostics?: {
    isCloudConfigured: boolean;
    mode: string;
    missingCredentials: string[];
  };
}

export const TrainingControlPanel: React.FC = () => {
  const [data, setData] = useState<TrainingStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchThreshold, setBatchThreshold] = useState(5);
  const [isRetrainModalOpen, setIsRetrainModalOpen] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/training/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load training status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRollback = async (targetVersion: string) => {
    const confirm = window.confirm(`Rollback active model to ${targetVersion}?`);
    if (!confirm) return;

    try {
      const res = await fetch('/api/training/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-training-secret': 'agrivision_secret_admin_token_change_in_production'
        },
        body: JSON.stringify({ action: 'rollback', targetVersion })
      });
      if (res.ok) {
        setRollbackSuccess(`Successfully rolled back active model to ${targetVersion}`);
        fetchStatus();
      }
    } catch (err) {
      console.error('Rollback failed:', err);
    }
  };

  const isReady = (data?.untrainedCorrectionsCount ?? 0) >= batchThreshold;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Direct Correction Learning & Training Control</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Phase 2
              </span>
              {loading && (
                <span className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous dataset curation, PyTorch MobileNetV3 retraining & regression guard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadDatasetExport('json')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => downloadDatasetExport('csv')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {rollbackSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{rollbackSuccess}</span>
        </div>
      )}

      {/* Grid: Active Model & Corrections Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Active Production Model Card */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Production Model
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Active in Browser
            </span>
          </div>

          <div>
            <div className="text-xl font-black text-white font-mono">
              {data?.activeModel?.version || '2.0.0-ONNX'}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Checkpoint: {data?.activeModel?.checkpoint_name || 'best_tomato_mobilenetv3_v2.pth'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PlantVillage Benchmark</span>
              <strong className="text-emerald-400 text-sm">{data?.activeModel?.pv_accuracy || 99.56}%</strong>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PlantDoc In-Field Acc</span>
              <strong className="text-amber-400 text-sm">{data?.activeModel?.plantdoc_accuracy || 47.54}%</strong>
            </div>
          </div>
        </div>

        {/* Retraining Dataset Queue */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Dataset Corrections Queue
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[10px]">Batch Threshold:</span>
              <select
                value={batchThreshold}
                onChange={(e) => setBatchThreshold(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
              >
                <option value={1}>1 correction</option>
                <option value={5}>5 corrections</option>
                <option value={10}>10 corrections</option>
                <option value={25}>25 corrections</option>
              </select>
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {data?.untrainedCorrectionsCount ?? 0}
              </div>
              <p className="text-xs text-slate-400">
                New approved corrections pending retraining
              </p>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              isReady
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isReady ? 'Batch Threshold Met' : `Need ${Math.max(0, batchThreshold - (data?.untrainedCorrectionsCount ?? 0))} more`}
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsRetrainModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.99]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch PyTorch Retraining Workflow</span>
            </button>
          </div>
        </div>

      </div>

      {/* Model Registry & Rollback History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Model Registry & Candidate Evaluation History</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Model Version</th>
                <th className="p-3">Checkpoint</th>
                <th className="p-3">PlantVillage</th>
                <th className="p-3">PlantDoc</th>
                <th className="p-3">Regression Guard</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {(data?.modelHistory || []).map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-white">{m.version}</td>
                  <td className="p-3 text-slate-400 truncate max-w-[160px]">{m.checkpoint_name}</td>
                  <td className="p-3 text-emerald-400">{m.pv_accuracy}%</td>
                  <td className="p-3 text-amber-400">{m.plantdoc_accuracy}%</td>
                  <td className="p-3">
                    {m.status === 'rejected' ? (
                      <span className="text-red-400 flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Regression Rejected
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        No Regression
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {m.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] uppercase">
                        {m.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {!m.is_active && m.status !== 'rejected' && (
                      <button
                        onClick={() => handleRollback(m.version)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-sans flex items-center gap-1 inline-flex transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Rollback</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retrain Action Modal */}
      {isRetrainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>PyTorch Retraining Workflow (Google Colab)</span>
              </h3>
              <button
                onClick={() => setIsRetrainModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                To preserve production stability and avoid serverless execution limits, PyTorch fine-tuning runs on GPU in Google Colab.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">1</span>
                  <span>Export Ground Truth Dataset</span>
                </div>
                <p className="text-slate-400 pl-7">
                  All newly corrected leaf photos and labels are exported via <code>/api/corrections/export</code>.
                </p>

                <div className="flex items-center gap-2 font-bold text-white pt-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">2</span>
                  <span>Execute Colab Notebook</span>
                </div>
                <p className="text-slate-400 pl-7">
                  Fine-tunes <code>best_tomato_mobilenetv3_v2.pth</code>, verifies candidate against validation benchmark, and exports <code>tomato_mobilenetv3_candidate.onnx</code>.
                </p>

                <div className="flex items-center gap-2 font-bold text-white pt-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">3</span>
                  <span>Automated Regression Evaluation</span>
                </div>
                <p className="text-slate-400 pl-7">
                  The candidate is tested. If it regresses, it is automatically rejected. If it passes, it updates the model registry.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsRetrainModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <a
                href="https://colab.research.google.com/"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <span>Open in Google Colab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
