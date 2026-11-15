import React from 'react';
import type { PipelineStageStatus, Crop } from '../../models/types';
import { Cpu, CheckCircle2, Loader2, ShieldCheck, Search, Scan, Layers, Eye } from 'lucide-react';
import { useTranslation } from '../../i18n/i18nContext';

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
  const { t } = useTranslation();

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'quality':
        return Search;
      case 'detection':
      case 'yolo':
      case 'yolo11':
        return Scan;
      case 'segmentation':
      case 'sam':
        return Layers;
      case 'onnx':
      case 'resnet50':
      case 'mobilenetv3':
        return Cpu;
      case 'lime':
        return Eye;
      default:
        return Cpu;
    }
  };

  const getLocalizedStageName = (stage: PipelineStageStatus) => {
    switch (stage.id) {
      case 'quality':
        return t.pipeline.stage1Name;
      case 'detection':
        return t.pipeline.stage2Name;
      case 'segmentation':
        return t.pipeline.stage3Name;
      case 'onnx':
        return t.pipeline.stage4Name;
      case 'lime':
        return t.pipeline.stage5Name;
      default:
        return stage.name;
    }
  };

  const getLocalizedStageDesc = (stage: PipelineStageStatus) => {
    switch (stage.id) {
      case 'quality':
        return t.pipeline.stage1Desc;
      case 'detection':
        return t.pipeline.stage2Desc;
      case 'segmentation':
        return t.pipeline.stage3Desc;
      case 'onnx':
        return t.pipeline.stage4Desc;
      case 'lime':
        return t.pipeline.stage5Desc;
      default:
        return stage.description;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>MobileNetV3 ONNX Edge Inference Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {t.pipeline.evaluating.replace('...', ` (${crop.name})...`)}
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          {t.pipeline.runningStages}
        </p>
      </div>

      {/* Main Grid: Image Preview + Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Input Image Preview with scanning pulse */}
        <div className="md:col-span-5 relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-2xl aspect-square flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Leaf under AI model analysis"
            className="w-full h-full object-cover opacity-85"
          />

          {/* Animated Scanning Laser Line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite]" />

          <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between border border-emerald-900/60">
            <span>Crop: {crop.name}</span>
            <span className="font-semibold text-white">224x224 RGB Float32</span>
          </div>
        </div>

        {/* Right: Pipeline Steps List */}
        <div className="md:col-span-7 space-y-3.5">
          {stages.map((stage) => {
            const Icon = getStageIcon(stage.id);
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';
            const isFailed = stage.status === 'failed';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isRunning
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                    : isCompleted
                    ? 'bg-slate-900/80 border-emerald-800/40 opacity-90'
                    : isFailed
                    ? 'bg-red-950/40 border-red-800/60'
                    : 'bg-slate-950/50 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isRunning
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                        : isCompleted
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : isFailed
                        ? 'bg-red-950 text-red-400 border border-red-800/60'
                        : 'bg-slate-900 text-slate-600'
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-bold truncate ${
                          isRunning
                            ? 'text-emerald-400'
                            : isCompleted
                            ? 'text-white'
                            : isFailed
                            ? 'text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {getLocalizedStageName(stage)}
                      </h3>
                      {stage.durationMs > 0 && isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50 shrink-0">
                          {stage.durationMs}ms
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {stage.outputSummary || getLocalizedStageDesc(stage)}
                    </p>

                    {isCompleted && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-300 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{stage.modelName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
