import React from 'react';
import type { FullAnalysisResult } from '../../models/types';
import { AlertCircle, CheckCircle2, AlertTriangle, Sparkles, ArrowRight, ShieldAlert, BookOpen, Sprout } from 'lucide-react';
import { ONNXDebugPanel } from './ONNXDebugPanel';

interface DiseaseResultCardProps {
  result: FullAnalysisResult;
  onScanAnother: () => void;
  onGoToDashboard: () => void;
}

export const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({
  result,
  onScanAnother,
  onGoToDashboard
}) => {
  const { crop, disease, imageUrl, confidence, confidenceLevel, confidenceLabel, classProbabilities } = result;

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Moderate':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Low':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      
      {/* 1. Analyzed Leaf Photo */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>Image Analyzed</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
            {crop.icon} {crop.name} Leaf
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[380px] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Uploaded leaf photo analyzed by MobileNetV3 ONNX model"
            className="max-h-[380px] w-full object-contain bg-slate-950"
          />
        </div>
      </div>

      {/* 2. Model Prediction Banner */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Model Prediction
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            MobileNetV3 ONNX Classifier
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {disease.name}
            </h1>
            <p className="text-xs text-emerald-400 italic font-medium mt-0.5">
              {disease.scientificName}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">Confidence:</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {confidence.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Confidence Level Badge & Label */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${getConfidenceBadgeColor(confidenceLevel)}`}>
          {confidenceLevel === 'High' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : confidenceLevel === 'Moderate' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div className="text-xs font-semibold">
            <span>Confidence Level: <strong>{confidenceLevel}</strong></span>
            <p className="text-[11px] opacity-90 mt-0.5">{confidenceLabel}</p>
          </div>
        </div>

        {/* Low Confidence Warning Notice */}
        {confidenceLevel === 'Low' && (
          <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-800/50 text-red-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>
              <strong>Low-confidence prediction:</strong> Consider taking another clear photo of the leaf in good lighting or seeking expert agricultural officer confirmation.
            </span>
          </div>
        )}

        {/* Probability Distribution Breakdown across top 3 classes */}
        {classProbabilities && classProbabilities.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Top Model Class Probabilities
            </h4>
            <div className="space-y-1.5">
              {classProbabilities.slice(0, 3).map((item) => (
                <div key={item.classIndex} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">{item.displayName}</span>
                    <span className="text-emerald-400 font-bold">{item.probability.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.probability))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Static Verified Disease Knowledge */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
        
        {/* About This Disease */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>About This Disease</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {disease.description}
          </p>
        </div>

        {/* Common Visible Symptoms */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Common Visible Symptoms</span>
          </h3>
          <p className="text-[11px] text-slate-400 italic">
            Common symptoms of this disease include:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            {disease.commonSymptoms.map((symptom, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* General Management & Prevention */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>General Management & Prevention</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {disease.generalManagement.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-amber-950/20 p-3 rounded-xl border border-amber-900/40">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  {idx + 1}
                </div>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Developer ONNX Debugger Panel */}
      <ONNXDebugPanel result={result} />

      {/* Mandatory AI Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-amber-200 text-xs text-center flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Important:</strong> This is an AI model prediction, not a confirmed diagnosis.
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onScanAnother}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Analyze Another Leaf</span>
        </button>

        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
