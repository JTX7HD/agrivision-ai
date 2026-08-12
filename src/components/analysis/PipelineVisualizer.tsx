import React from 'react';
import type { PipelineStageStatus, Crop } from '../../models/types';
import { Cpu, CheckCircle2, Loader2, Layers, Eye, ScanSearch, ShieldCheck } from 'lucide-react';

interface PipelineVisualizerProps {
  crop: Crop;
  imageUrl: string;
  stages: PipelineStageStatus[];
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  crop,
  imageUrl,
  stages
}) => {
  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'yolo11':
        return ScanSearch;
      case 'sam':
        return Layers;
      case 'resnet50':
        return Cpu;
      case 'lime':
        return Eye;
      default:
        return Cpu;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>IEEE 2025 Hierarchical 4-Stage AI Pipeline</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analyzing {crop.name} Leaf...
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Executing multi-stage neural network models: Object Detection $\rightarrow$ Neural Segmentation $\rightarrow$ Deep Classification $\rightarrow$ LIME Explainability.
        </p>
      </div>

      {/* Main Grid: Image Preview + Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Input Image Preview with scanning pulse */}
        <div className="md:col-span-5 relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-2xl aspect-square flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Leaf under AI analysis"
            className="w-full h-full object-cover opacity-80"
          />

          {/* Animated Scanning Laser Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite]" />

          {/* Bounding Box Visualizer Animation */}
          <div className="absolute inset-8 border-2 border-emerald-400/70 rounded-xl pointer-events-none animate-pulse flex items-start justify-end p-2">
            <span className="text-[10px] font-mono bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              YOLO11 ROI
            </span>
          </div>

          <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between border border-emerald-900/60">
            <span>Crop: {crop.name}</span>
            <span className="font-semibold text-white">4096 Superpixels</span>
          </div>
        </div>

        {/* Right: Pipeline Steps List */}
        <div className="md:col-span-7 space-y-3.5">
          {stages.map((stage) => {
            const Icon = getStageIcon(stage.id);
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isRunning
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-slate-900/80 border-emerald-800/40 opacity-90'
                    : 'bg-slate-950/50 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isRunning
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCompleted
                        ? 'bg-emerald-900/60 text-emerald-400 border border-emerald-700/50'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isRunning ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{stage.name}</span>
                      </h4>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {stage.modelName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1">
                      {stage.description}
                    </p>

                    {isCompleted && stage.outputSummary && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                        ✓ {stage.outputSummary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Processing image strictly locally & in mock pipeline environment for Review 1.</span>
      </div>

    </div>
  );
};
