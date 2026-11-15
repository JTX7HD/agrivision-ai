import React, { useState } from 'react';
import type { FullAnalysisResult, LimeExplanation, LeafSegmentation } from '../../models/types';
import {
  CheckCircle2, AlertTriangle, Sparkles, ArrowRight, ShieldAlert,
  BookOpen, Sprout, Edit3, Database, Download, Eye, Layers, Loader2
} from 'lucide-react';
import { ONNXDebugPanel } from './ONNXDebugPanel';
import { CorrectionModal } from './CorrectionModal';
import { downloadDatasetExport } from '../../services/correctionService';
import type { LeafCorrectionRecord } from '../../models/correctionTypes';
import { useTranslation } from '../../i18n/i18nContext';
import { defaultExplainabilityEngine } from '../../services/explainability/limeExplainer';
import { getSAMStatus, defaultLeafSegmenter } from '../../services/pipeline/leafSegmentationService';

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
  const { t } = useTranslation();
  const {
    crop,
    disease,
    imageUrl,
    confidence,
    confidenceLevel,
    confidenceLabel,
    classProbabilities,
    primaryLeaf,
    secondPrediction,
    topMargin,
    uncertainty
  } = result;

  const yoloBox = primaryLeaf?.detection?.box;
  const yoloConfidence = primaryLeaf?.detection?.confidence ? (primaryLeaf.detection.confidence * 100).toFixed(1) : null;

  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [savedCorrection, setSavedCorrection] = useState<LeafCorrectionRecord | null>(null);

  // LIME State
  const [limeExplanation, setLimeExplanation] = useState<LimeExplanation | null>(result.explanation || null);
  const [isComputingLime, setIsComputingLime] = useState(false);
  const [limeProgress, setLimeProgress] = useState(0);
  const [limeError, setLimeError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const samStatus = getSAMStatus();

  const handleRunLIME = async () => {
    setIsComputingLime(true);
    setLimeProgress(10);
    setLimeError(null);

    const targetLeafImage = primaryLeaf?.segmentation?.isolatedLeafImageUrl
      || primaryLeaf?.detection?.croppedImageUrl
      || imageUrl;

    try {
      const expl = await defaultExplainabilityEngine.generateDetailedExplanation(
        targetLeafImage,
        result as any,
        result.predictedClassIndex,
        { numPatchesGrid: 4, numSamples: 16 },
        (p) => setLimeProgress(p)
      );
      setLimeExplanation(expl);
      setShowHeatmap(true);
    } catch (err) {
      setLimeError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsComputingLime(false);
    }
  };

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

  // View mode for leaf photo analysis
  const [viewMode, setViewMode] = useState<'sam_mask' | 'yolo' | 'isolated' | 'original'>('sam_mask');
  const [currentSegmentation, setCurrentSegmentation] = useState<LeafSegmentation | undefined>(primaryLeaf?.segmentation);
  const [isInteractiveSegmenting, setIsInteractiveSegmenting] = useState(false);
  const [lastPromptPoint, setLastPromptPoint] = useState<{ x: number; y: number } | null>(null);

  const handleInteractivePrompt = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'sam_mask' && viewMode !== 'isolated') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    setLastPromptPoint({ x: Math.round(clickX * 100), y: Math.round(clickY * 100) });
    setIsInteractiveSegmenting(true);

    try {
      const res = await defaultLeafSegmenter.segmentLeaf(
        imageUrl,
        primaryLeaf?.detection || { id: 'manual', box: { x: 0, y: 0, width: 1, height: 1 }, confidence: 1, label: 'leaf' },
        { x: clickX, y: clickY, isNormalized: true }
      );
      setCurrentSegmentation(res);
    } catch (err) {
      console.error('Interactive MobileSAM segmentation error:', err);
    } finally {
      setIsInteractiveSegmenting(false);
    }
  };

  const handleResetToYOLO = async () => {
    setLastPromptPoint(null);
    setIsInteractiveSegmenting(true);
    try {
      const res = await defaultLeafSegmenter.segmentLeaf(
        imageUrl,
        primaryLeaf?.detection || { id: 'manual', box: { x: 0, y: 0, width: 1, height: 1 }, confidence: 1, label: 'leaf' }
      );
      setCurrentSegmentation(res);
    } catch (err) {
      console.error('Reset to YOLO prompt error:', err);
    } finally {
      setIsInteractiveSegmenting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      
      {/* 1. Analyzed Leaf Photo with YOLO & SAM Segmentation */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span>{t.results.imageAnalyzed}</span>
          </h2>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('sam_mask')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'sam_mask'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SAM Mask
            </button>
            <button
              type="button"
              onClick={() => setViewMode('isolated')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'isolated'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Isolated Leaf
            </button>
            <button
              type="button"
              onClick={() => setViewMode('yolo')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'yolo'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              YOLO Box
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'original'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original
            </button>
          </div>

          <div className="flex items-center gap-2">
            {yoloConfidence && (
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                YOLO: {yoloConfidence}%
              </span>
            )}
            <span className="text-xs font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              {crop.icon} {crop.name}
            </span>
          </div>
        </div>

        {/* Leaf View Canvas Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-h-[380px] flex items-center justify-center p-2">
          <div
            className={`relative inline-block max-h-[360px] max-w-full select-none ${
              viewMode === 'sam_mask' || viewMode === 'isolated' ? 'cursor-crosshair' : ''
            }`}
            onClick={handleInteractivePrompt}
            title={viewMode === 'sam_mask' ? 'Click anywhere on the leaf to adjust SAM segmentation' : undefined}
          >
            {/* Base Image */}
            <img
              src={viewMode === 'isolated' && currentSegmentation?.isolatedLeafImageUrl ? currentSegmentation.isolatedLeafImageUrl : imageUrl}
              alt="Uploaded leaf photo analyzed by YOLO and MobileNetV3"
              className="max-h-[360px] max-w-full block rounded-lg object-contain"
            />

            {/* SAM Mask Overlay */}
            {viewMode === 'sam_mask' && currentSegmentation?.maskDataUrl && (
              <img
                src={currentSegmentation.maskDataUrl}
                alt="MobileSAM Emerald Mask Overlay"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded-lg transition-opacity duration-200"
              />
            )}

            {/* YOLO11n Bounding Box Overlay */}
            {viewMode === 'yolo' && yoloBox && (
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/15 pointer-events-none rounded shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all duration-300"
                style={{
                  left: `${Math.max(0, Math.min(100, yoloBox.x * 100))}%`,
                  top: `${Math.max(0, Math.min(100, yoloBox.y * 100))}%`,
                  width: `${Math.max(2, Math.min(100, yoloBox.width * 100))}%`,
                  height: `${Math.max(2, Math.min(100, yoloBox.height * 100))}%`
                }}
              >
                <div className="absolute -top-5 left-0 bg-emerald-500 text-slate-950 font-bold font-mono text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  Leaf detected {yoloConfidence ? `(${yoloConfidence}%)` : ''}
                </div>
              </div>
            )}

            {/* Interactive Prompt Indicator */}
            {lastPromptPoint && (viewMode === 'sam_mask' || viewMode === 'isolated') && (
              <div
                className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none animate-ping"
                style={{ left: `${lastPromptPoint.x}%`, top: `${lastPromptPoint.y}%` }}
              />
            )}

            {/* Loading Spinner for SAM Prompt Re-inference */}
            {isInteractiveSegmenting && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Computing MobileSAM Mask...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Click Guidance Banner */}
        {(viewMode === 'sam_mask' || viewMode === 'isolated') && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>
                {lastPromptPoint
                  ? `Prompt point placed at (${lastPromptPoint.x}%, ${lastPromptPoint.y}%).`
                  : 'Click anywhere on the leaf to adjust the MobileSAM segmentation prompt.'}
              </span>
            </div>
            {lastPromptPoint && (
              <button
                type="button"
                onClick={handleResetToYOLO}
                className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] underline cursor-pointer"
              >
                Reset to YOLO ROI prompt
              </button>
            )}
          </div>
        )}

        {/* SAM Segmentation Metrics & Provenance Banner */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-white">MobileSAM Segmentation:</strong>
                {currentSegmentation?.iou !== undefined && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    IoU: {(currentSegmentation.iou * 100).toFixed(1)}%
                  </span>
                )}
                {currentSegmentation?.areaRatio !== undefined && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Coverage: {(currentSegmentation.areaRatio * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {currentSegmentation?.isRealSAM
                  ? 'Real TinyViT-5M + SAM Mask Decoder (19.8 MB ONNX, Apache 2.0). Isolates leaf geometry without modifying classifier input.'
                  : samStatus.statusMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 whitespace-nowrap">
              {currentSegmentation?.isRealSAM ? 'Real MobileSAM (Apache 2.0)' : 'Pass-Through'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Model Prediction Banner */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            {uncertainty?.isUncertain ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400">{t.results.uncertainCondition}</span>
              </>
            ) : (
              <span className="text-emerald-400">{t.results.diseaseClassification}</span>
            )}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {result.classifierInfo?.modelName || 'MobileNetV3 V2 Classifier'}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {disease.name}
              </h1>
              {uncertainty?.isUncertain && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Uncertain
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-400 italic font-medium mt-0.5">
              {disease.scientificName}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">{t.results.topConfidence}</div>
            <div className={`text-2xl font-black font-mono ${uncertainty?.isUncertain ? 'text-amber-400' : 'text-emerald-400'}`}>
              {confidence.toFixed(1)}%
            </div>
            {topMargin !== undefined && (
              <div className="text-[10px] font-mono text-slate-400">
                {t.results.margin} +{topMargin.toFixed(1)} pp
              </div>
            )}
          </div>
        </div>

        {/* Confident Prediction Indicator */}
        {!uncertainty?.isUncertain && (
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${getConfidenceBadgeColor(confidenceLevel)}`}>
            {confidenceLevel === 'High' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="text-xs font-semibold">
              <span>{t.results.confidenceLevel} <strong>{confidenceLevel}</strong></span>
              <p className="text-[11px] opacity-90 mt-0.5">{confidenceLabel}</p>
            </div>
          </div>
        )}

        {/* Primary Consolidated Uncertainty Warning Banner */}
        {uncertainty?.isUncertain && (
          <div
            data-testid="primary-uncertainty-banner"
            className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-3 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-sm text-white">
                    {uncertainty.isAmbiguous && uncertainty.isWeakConfidence
                      ? t.uncertainty.ambiguousTitle
                      : uncertainty.isAmbiguous
                      ? t.uncertainty.ambiguousTitle
                      : t.uncertainty.lowConfidenceTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300">
                      Reason:{' '}
                      {uncertainty.isAmbiguous
                        ? t.uncertainty.closeScores
                        : t.uncertainty.lowConfidenceTitle}
                    </span>
                    {topMargin !== undefined && uncertainty.isAmbiguous && (
                      <span className="text-[10px] font-mono bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60 text-amber-300">
                        Margin: {topMargin.toFixed(1)} pp
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {uncertainty.warningMessage || t.uncertainty.expertAdvice}
                </p>
              </div>
            </div>

            {/* Second Prediction comparison */}
            {secondPrediction && (
              <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Leading Candidates Comparison:</span>
                  <span className="text-amber-400 font-semibold">
                    Separation: {topMargin !== undefined ? topMargin.toFixed(1) : (confidence - secondPrediction.probability).toFixed(1)} pp
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">1. Suspected:</span>
                      <span className="font-bold text-white block">{disease.name}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">{confidence.toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">2. {t.results.runnerUp}</span>
                      <span className="font-bold text-white block">{secondPrediction.displayName}</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400">{secondPrediction.probability.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Probability Distribution Breakdown across top 3 classes */}
        {classProbabilities && classProbabilities.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t.results.topProbabilities}
              </h4>
              {topMargin !== undefined && (
                <span className="text-[10px] font-mono text-slate-400">
                  Top-Two Margin: <strong className={topMargin < 10.0 ? 'text-amber-400' : 'text-emerald-400'}>{topMargin.toFixed(1)} pp</strong>
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {classProbabilities.slice(0, 3).map((item, idx) => {
                const isTop = idx === 0;
                const isSecond = idx === 1;
                return (
                  <div key={item.classIndex} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`flex items-center gap-1.5 ${isTop ? 'text-white font-bold' : isSecond ? 'text-amber-300' : 'text-slate-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isTop ? 'bg-emerald-400' : isSecond ? 'bg-amber-400' : 'bg-slate-500'}`} />
                        <span>{item.displayName}</span>
                        {isTop && <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">Top</span>}
                        {isSecond && <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">2nd</span>}
                      </span>
                      <span className={`font-bold ${isTop ? 'text-emerald-400' : isSecond ? 'text-amber-400' : 'text-slate-400'}`}>
                        {item.probability.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-emerald-500' : isSecond ? 'bg-amber-500' : 'bg-slate-600'}`}
                        style={{ width: `${Math.min(100, Math.max(0, item.probability))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Correction Feedback / Action Banner */}
        {savedCorrection ? (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white">{t.results.groundTruthCorrected}</strong>{' '}
                <span className="font-semibold text-emerald-300">{savedCorrection.correctedClassName}</span>
                <p className="text-[11px] text-emerald-400/80">
                  Committed to persistent dataset · Queued for next retraining run
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCorrectionOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] transition-colors"
            >
              Edit Correction
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.results.testingNotice}</span>
            </div>
            <button
              onClick={() => setIsCorrectionOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.results.correctLabel}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. LIME Visual Explainability Panel */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">{t.lime.title}</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/60">
            {t.lime.explainedClass} {disease.name}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t.lime.description}
        </p>

        {limeExplanation?.heatmapImageUrl ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5 text-center">
                <span className="text-[11px] font-mono text-slate-400 block">Original Leaf ROI</span>
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-square flex items-center justify-center p-2">
                  <img src={imageUrl} alt="Original Leaf" className="w-full h-full object-contain rounded-lg" />
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">LIME Superpixel Heatmap</span>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    {showHeatmap ? 'Hide Overlay' : 'Show Overlay'}
                  </button>
                </div>
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/40 shadow-lg aspect-square flex items-center justify-center p-2">
                  <img
                    src={showHeatmap ? limeExplanation.heatmapImageUrl : imageUrl}
                    alt="LIME Heatmap"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  {showHeatmap && (
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 border border-emerald-800/60">
                      Green = Support | Red = Oppose
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Feature attributions list */}
            {limeExplanation.topFeatures && limeExplanation.topFeatures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Top Regional Feature Attributions
                </h4>
                <div className="space-y-1.5">
                  {limeExplanation.topFeatures.map((feat, idx) => {
                    const isPositive = feat.importance >= 0;
                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-slate-200">{feat.description}</span>
                        </div>
                        <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{(feat.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              {limeExplanation.summary || t.lime.interpretationGuide}
            </p>

            <button
              onClick={handleRunLIME}
              disabled={isComputingLime}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isComputingLime ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{t.lime.computing} ({limeProgress}%)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{t.lime.recompute}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {limeError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-xs">
                {limeError}
              </div>
            )}
            <button
              onClick={handleRunLIME}
              disabled={isComputingLime}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600/30 to-leaf-600/30 hover:from-emerald-600/40 hover:to-leaf-600/40 text-emerald-200 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {isComputingLime ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>{t.lime.computing} ({limeProgress}%)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{t.lime.explainBtn}</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
          {t.lime.disclaimer}
        </div>
      </div>

      {/* 4. Verified Disease Knowledge */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
        
        {/* About This Disease */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>{t.results.aboutDisease}</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
            {disease.description}
          </p>
        </div>

        {/* Common Visible Symptoms */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>{t.results.commonSymptoms}</span>
          </h3>
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
            <span>{t.results.management}</span>
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
        <span>{t.results.aiDisclaimer}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          onClick={onScanAnother}
          className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="w-5 h-5" />
          <span>{t.results.analyzeAnother}</span>
        </button>

        <button
          onClick={() => downloadDatasetExport('json')}
          className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          title="Export ground truth dataset in JSON format"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t.results.exportDataset}</span>
        </button>

        <button
          onClick={onGoToDashboard}
          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>{t.results.goToDashboard}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Direct Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        result={result}
        onCorrectionSuccess={(record) => {
          setSavedCorrection(record);
        }}
      />

    </div>
  );
};
