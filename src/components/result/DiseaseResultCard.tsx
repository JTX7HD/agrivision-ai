import React from 'react';
import type { FullAnalysisResult } from '../../models/types';
import { LimeHeatmapOverlay } from './LimeHeatmapOverlay';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Sprout, ArrowRight, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const { crop, disease, imageUrl, yoloBoundingBox, limeFeatures } = result;

  React.useEffect(() => {
    if (disease.severity === 'Healthy') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [disease.severity]);

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'Healthy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Mild':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Moderate':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Severe':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      
      {/* Top Banner & Confidence Badge */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{crop.icon}</span>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {crop.name} Diagnosis
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {disease.name}
              </h1>
              <p className="text-xs text-emerald-400 italic font-medium">
                {disease.scientificName}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getSeverityBadgeClass(disease.severity)}`}>
              {disease.severity === 'Healthy' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{disease.severity} Severity</span>
            </div>

            <div className="text-xs font-mono text-slate-300">
              Model Confidence: <span className="font-extrabold text-emerald-400">{disease.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Demo Flag Notice */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong className="font-bold">Interim Demo Flag:</strong> Prototype neural prediction output generated via simulated IEEE 4-stage pipeline abstraction.
          </span>
        </div>

        {/* Overview Description */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {disease.description}
        </p>

      </div>

      {/* LIME & Visual Overlays Component */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center justify-between">
          <span>AI Visual Explainability & Segmentation</span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
            LIME + SAM
          </span>
        </h3>

        <LimeHeatmapOverlay
          imageUrl={imageUrl}
          cropName={crop.name}
          diseaseName={disease.name}
          boundingBox={yoloBoundingBox}
          limeFeatures={limeFeatures}
        />
      </div>

      {/* Symptoms & Action Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span>Key Visual Symptoms</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {disease.symptoms.map((symptom, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Immediate Farmer Action Plan</span>
          </h3>

          <ul className="space-y-2.5 text-xs text-slate-300">
            {disease.immediateAction.map((action, idx) => (
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

      {/* Prevention & Treatments */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>Long-Term Management & Controls</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-wider">
              Organic & Cultural Practices
            </h4>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              {disease.prevention.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {disease.chemicalControl && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-bold text-blue-400 text-xs uppercase tracking-wider">
                Recommended Chemical Spraying
              </h4>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {disease.chemicalControl.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onScanAnother}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5" />
          <span>Scan Another Leaf</span>
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
