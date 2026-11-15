import React, { useState } from 'react';
import {
  X, Check, CheckCircle2,
  Database, Sparkles, AlertCircle, Download
} from 'lucide-react';
import type { FullAnalysisResult } from '../../models/types';
import type { ClassMappingEntry } from '../../services/onnx/classMapper';
import { getCropClassifierAdapter } from '../../services/pipeline/cropAdapters';
import { submitCorrection, downloadDatasetExport } from '../../services/correctionService';
import type { LeafCorrectionRecord } from '../../models/correctionTypes';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: FullAnalysisResult;
  onCorrectionSuccess?: (record: LeafCorrectionRecord) => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  result,
  onCorrectionSuccess
}) => {
  const {
    imageUrl,
    disease,
    confidence,
    predictedClassIndex,
    predictedClassName,
    primaryLeaf,
    classifierInfo
  } = result;

  const cropId = result.crop.id;
  const cropDisplayName = result.crop.name || 'Crop';
  const adapter = getCropClassifierAdapter(cropId);
  const supportedClasses = adapter.supportedClasses;

  const [selectedClassIndex, setSelectedClassIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [successRecord, setSuccessRecord] = useState<LeafCorrectionRecord | null>(null);
  const [storageProvider, setStorageProvider] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectClass = (classIndex: number) => {
    setSelectedClassIndex(classIndex);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassIndex === null) {
      setErrorMsg(`Please select the true, verified ${cropDisplayName} leaf disease class.`);
      return;
    }

    const selectedEntry = supportedClasses.find((c) => c.index === selectedClassIndex);
    if (!selectedEntry) {
      setErrorMsg('Invalid class selection.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setErrorDetails(null);

    const payload = {
      imageDataUrl: imageUrl,
      correctedClassIndex: selectedEntry.index,
      correctedClassName: selectedEntry.className,
      predictedClassIndex: predictedClassIndex ?? -1,
      predictedClassName: predictedClassName || disease.name,
      confidence: confidence,
      modelVersion: classifierInfo?.version || adapter.modelInfo.version || '2.0.0-ONNX',
      modelCheckpoint: classifierInfo?.checkpoint || adapter.modelInfo.checkpoint || 'best_tomato_mobilenetv3_v2.pth',
      cropId: result.crop.id,
      yoloBox: primaryLeaf?.detection?.box
        ? {
            x: primaryLeaf.detection.box.x,
            y: primaryLeaf.detection.box.y,
            width: primaryLeaf.detection.box.width,
            height: primaryLeaf.detection.box.height,
            confidence: primaryLeaf.detection.confidence
          }
        : undefined,
      notes: notes.trim() || undefined
    };

    const res = await submitCorrection(payload);
    setIsSubmitting(false);

    if (res.success && res.record) {
      setSuccessRecord(res.record);

      let providerName = 'Local Disk Persistent (data/corrections/manifest.json)';
      let warningText: string | null = null;

      if (res.diagnostics?.isCloudConfigured) {
        providerName = 'Vercel Blob + Supabase (Cloud Persistent)';
      } else if (res.diagnostics?.isVercel || res.diagnostics?.isPersistent === false) {
        providerName = 'Vercel Ephemeral Storage (Non-Persistent: Serverless Instance)';
        warningText =
          res.diagnostics?.persistenceWarning ||
          'Running on Vercel Serverless without cloud database credentials. Corrections will NOT persist across serverless instances or redeployments.';
      } else {
        providerName = 'Local Disk Persistent (data/corrections/manifest.json)';
      }

      setStorageProvider(providerName);
      setStorageWarning(warningText);
      onCorrectionSuccess?.(res.record);
    } else {
      setErrorMsg(res.error || 'Failed to save correction to persistent storage.');
      setErrorDetails(res.details || null);
    }
  };

  const handleReset = () => {
    setSuccessRecord(null);
    setSelectedClassIndex(null);
    setNotes('');
    setErrorMsg(null);
    setErrorDetails(null);
    setStorageWarning(null);
    onClose();
  };

  const selectedClass = selectedClassIndex !== null ? supportedClasses.find((c) => c.index === selectedClassIndex) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Direct Correction Learning
              </h2>
              <p className="text-xs text-slate-400">
                Save verified ground truth to the persistent retraining dataset
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Success View */}
          {successRecord ? (
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Correction Stored Successfully!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {storageWarning ? (
                    <span>The leaf image and label <strong className="text-emerald-400">{selectedClass?.displayName}</strong> have been accepted for training.</span>
                  ) : (
                    <span>The leaf image and label <strong className="text-emerald-400">{selectedClass?.displayName}</strong> have been permanently committed to local persistent storage.</span>
                  )}
                </p>
              </div>

              {/* Warning if on Vercel without persistent cloud DB */}
              {storageWarning && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs text-left flex items-start gap-2.5 max-w-lg mx-auto">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Serverless Ephemeral Storage Notice</p>
                    <p className="text-[11px] opacity-90 leading-relaxed">{storageWarning}</p>
                  </div>
                </div>
              )}

              {/* Record Summary Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-w-lg mx-auto text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Record ID:</span>
                  <span className="text-slate-200 truncate max-w-[240px]">{successRecord.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Model Predicted:</span>
                  <span className="text-red-400 font-bold">{predictedClassName} ({confidence.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Corrected Ground Truth:</span>
                  <span className="text-emerald-400 font-bold">{selectedClass?.displayName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Storage Engine:</span>
                  <span className={storageWarning ? "text-amber-400" : "text-cyan-400"}>{storageProvider}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Retraining Queue:</span>
                  <span className="text-amber-400">Queued for next {classifierInfo?.modelName || adapter.modelInfo.modelName || 'MobileNetV3'} run</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
                <button
                  onClick={() => downloadDatasetExport('json')}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Dataset (JSON)</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-colors shadow-md"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Correction Input Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Prediction vs Reality Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <img
                  src={imageUrl}
                  alt="Leaf candidate"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
                    Current Model Prediction
                  </div>
                  <div className="text-sm font-bold text-white truncate">
                    {disease.name}
                  </div>
                  <div className="text-xs text-amber-400 font-mono mt-0.5">
                    Confidence: {confidence.toFixed(1)}% ({result.confidenceLevel})
                  </div>
                </div>
              </div>

              {/* Class Selection Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Correct {cropDisplayName} Leaf Label ({supportedClasses.length} Classes)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to select</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                  {supportedClasses.map((entry: ClassMappingEntry) => {
                    const isSelected = selectedClassIndex === entry.index;
                    const isPredicted = entry.index === predictedClassIndex;

                    return (
                      <button
                        type="button"
                        key={entry.index}
                        onClick={() => handleSelectClass(entry.index)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate flex items-center gap-1.5">
                            <span>{entry.displayName}</span>
                            {isPredicted && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                Predicted
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            Class #{entry.index}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Correction Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified healthy leaf, lack of necrotic spots or chlorosis"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{errorMsg}</p>
                    {errorDetails && <p className="text-[11px] opacity-80 font-mono">{errorDetails}</p>}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exact original image & bounding box preserved</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || selectedClassIndex === null}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Saving to Dataset...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Save Correction</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
