import React, { useState } from 'react';
import type { LimeFeature } from '../../models/types';
import { Eye, Layers, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

interface LimeHeatmapOverlayProps {
  imageUrl: string;
  cropName: string;
  diseaseName: string;
  samSegmentationDataUrl?: string;
  samSuccess?: boolean;
  samStatusMessage?: string;
  limeFeatures?: LimeFeature[];
  limeHeatmapDataUrl?: string;
  limeSuccess?: boolean;
  limeStatusMessage?: string;
}

export const LimeHeatmapOverlay: React.FC<LimeHeatmapOverlayProps> = ({
  imageUrl,
  diseaseName,
  samSegmentationDataUrl,
  samSuccess = false,
  samStatusMessage,
  limeFeatures = [],
  limeHeatmapDataUrl,
  limeSuccess = false,
  limeStatusMessage
}) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'sam' | 'lime' | 'combined'>('lime');

  return (
    <div className="space-y-4">
      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('raw')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'raw'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Original</span>
        </button>

        <button
          onClick={() => setActiveTab('sam')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sam'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SAM Segmentation</span>
        </button>

        <button
          onClick={() => setActiveTab('lime')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'lime'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>LIME Explanation</span>
        </button>

        <button
          onClick={() => setActiveTab('combined')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'combined'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Combined View</span>
        </button>
      </div>

      {/* Visual Canvas Display */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-800/40 shadow-2xl max-h-[440px] flex items-center justify-center">
        {/* Original Base Photo */}
        <img
          src={imageUrl}
          alt="Original leaf input"
          className="w-full max-h-[440px] object-contain"
        />

        {/* SAM Segmentation Overlay */}
        {(activeTab === 'sam' || activeTab === 'combined') && (
          samSuccess && samSegmentationDataUrl ? (
            <img
              src={samSegmentationDataUrl}
              alt="SAM leaf mask"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-85"
            />
          ) : (
            <div className="absolute inset-x-4 bottom-4 bg-slate-950/90 border border-amber-500/50 p-3 rounded-xl text-amber-300 text-xs flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{samStatusMessage || 'Leaf segmentation unavailable'}</span>
            </div>
          )
        )}

        {/* LIME Explanation Overlay */}
        {(activeTab === 'lime' || activeTab === 'combined') && (
          limeSuccess && limeHeatmapDataUrl ? (
            <img
              src={limeHeatmapDataUrl}
              alt="LIME perturbation heatmap"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
            />
          ) : (
            <div className="absolute inset-x-4 bottom-4 bg-slate-950/90 border border-amber-500/50 p-3 rounded-xl text-amber-300 text-xs flex items-center justify-center gap-2 shadow-lg backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{limeStatusMessage || 'Visual explanation unavailable'}</span>
            </div>
          )
        )}

        {/* Render Genuine LIME Superpixel Markers if available */}
        {(activeTab === 'lime' || activeTab === 'combined') && limeSuccess && limeFeatures.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {limeFeatures.map((feat) => (
              <div
                key={feat.id}
                className="absolute rounded-xl border-2 border-amber-400 bg-amber-500/25 shadow-[0_0_15px_#f59e0b] flex items-center justify-center"
                style={{
                  left: `${feat.x}%`,
                  top: `${feat.y}%`,
                  width: `${feat.radius * 2}%`,
                  height: `${feat.radius * 2}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <span className="text-[10px] font-mono font-bold bg-slate-950/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 shadow-sm whitespace-nowrap">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guidance Info Banner */}
      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          {activeTab === 'lime' && (
            <p>
              <span className="font-bold text-amber-400">LIME Local Explanation:</span> Superpixel perturbation scoring highlights leaf regions driving MobileNetV3 prediction for <span className="text-white font-semibold">{diseaseName}</span>.
            </p>
          )}
          {activeTab === 'sam' && (
            <p>
              <span className="font-bold text-emerald-400">SAM Leaf Segmentation:</span> Real-time boundary contour mask isolating symptomatic leaf blade from background clutter.
            </p>
          )}
          {activeTab === 'combined' && (
            <p>
              <span className="font-bold text-emerald-400">Combined Explanation View:</span> Leaf segmentation mask layered with local MobileNetV3 LIME feature heatmap.
            </p>
          )}
          {activeTab === 'raw' && (
            <p>
              <span className="font-bold text-slate-200">Original Photo:</span> Unmodified camera leaf frame.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
