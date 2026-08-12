import React, { useState } from 'react';
import type { BoundingBox, LimeFeature } from '../../models/types';
import { Eye, Layers, Scan, Image as ImageIcon, Info } from 'lucide-react';

interface LimeHeatmapOverlayProps {
  imageUrl: string;
  cropName: string;
  diseaseName: string;
  boundingBox?: BoundingBox;
  limeFeatures?: LimeFeature[];
}

export const LimeHeatmapOverlay: React.FC<LimeHeatmapOverlayProps> = ({
  imageUrl,
  cropName,
  diseaseName,
  boundingBox,
  limeFeatures = []
}) => {
  const [activeOverlayTab, setActiveOverlayTab] = useState<'raw' | 'yolo' | 'sam' | 'lime'>('lime');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveOverlayTab('lime')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeOverlayTab === 'lime'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>LIME Heatmap</span>
        </button>

        <button
          onClick={() => setActiveOverlayTab('sam')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeOverlayTab === 'sam'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SAM Segment</span>
        </button>

        <button
          onClick={() => setActiveOverlayTab('yolo')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeOverlayTab === 'yolo'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          <span>YOLO11 Box</span>
        </button>

        <button
          onClick={() => setActiveOverlayTab('raw')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeOverlayTab === 'raw'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Raw Photo</span>
        </button>
      </div>

      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-800/40 shadow-2xl max-h-[440px] flex items-center justify-center">
        <img
          src={imageUrl}
          alt="Disease scan visual"
          className={`w-full max-h-[440px] object-contain transition-all duration-300 ${
            activeOverlayTab === 'sam' ? 'brightness-75 contrast-125' : ''
          }`}
        />

        {activeOverlayTab === 'yolo' && boundingBox && (
          <div
            className="absolute border-3 border-emerald-400 bg-emerald-500/10 rounded-xl shadow-[0_0_20px_#10b981] pointer-events-none transition-all"
            style={{
              left: `${boundingBox.x}%`,
              top: `${boundingBox.y}%`,
              width: `${boundingBox.width}%`,
              height: `${boundingBox.height}%`
            }}
          >
            <div className="absolute -top-7 left-0 bg-emerald-500 text-slate-950 font-mono font-extrabold text-[11px] px-2.5 py-0.5 rounded-md shadow-md flex items-center gap-1">
              <span>{cropName} Leaf</span>
              <span>({(boundingBox.confidence * 100).toFixed(0)}%)</span>
            </div>
          </div>
        )}

        {activeOverlayTab === 'sam' && (
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/60 via-transparent to-green-950/60 pointer-events-none flex items-center justify-center">
            <div className="border-2 border-dashed border-emerald-400/80 rounded-3xl inset-6 absolute pointer-events-none flex items-end justify-start p-3">
              <span className="text-[11px] font-mono bg-emerald-950/90 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/50 shadow-md">
                SAM Isolated Leaf Contour (Background Removed)
              </span>
            </div>
          </div>
        )}

        {activeOverlayTab === 'lime' && (
          <div className="absolute inset-0 pointer-events-none">
            {limeFeatures.map((feat) => (
              <div
                key={feat.id}
                className="absolute rounded-full border-2 border-amber-400 bg-amber-500/30 shadow-[0_0_20px_#f59e0b] animate-pulse flex items-center justify-center"
                style={{
                  left: `${feat.x}%`,
                  top: `${feat.y}%`,
                  width: `${feat.radius * 2.2}%`,
                  height: `${feat.radius * 2.2}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <span className="text-[10px] font-mono font-bold bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 shadow-sm whitespace-nowrap">
                  LIME ROI: {(feat.importanceScore * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          {activeOverlayTab === 'lime' && (
            <p>
              <span className="font-bold text-amber-400">LIME Explainability Mode:</span> Highlighting lesion superpixels that led the neural model to predict <span className="text-white font-semibold">{diseaseName}</span>.
            </p>
          )}
          {activeOverlayTab === 'sam' && (
            <p>
              <span className="font-bold text-emerald-400">SAM Segmentation Mode:</span> Isolating leaf boundary contours from soil, weeds, and background shadows.
            </p>
          )}
          {activeOverlayTab === 'yolo' && (
            <p>
              <span className="font-bold text-emerald-400">YOLO11 Object Detection:</span> Locating the primary crop leaf region of interest (ROI).
            </p>
          )}
          {activeOverlayTab === 'raw' && (
            <p>
              <span className="font-bold text-slate-200">Raw Input Photo:</span> Original unmodified smartphone camera frame.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
