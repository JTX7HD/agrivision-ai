import React from 'react';
import { BookOpen, ShieldAlert, Cpu, Layers, Scan, Eye } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-8 rounded-3xl border border-emerald-800/40 shadow-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Research Foundation & Academic Context</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About AgriVision AI
        </h1>

        <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
          An explainable artificial intelligence decision-support platform designed to assist smallholder farmers in early crop disease detection and sustainable treatment.
        </p>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>Research Foundation (2025 IEEE Access)</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <p className="font-bold text-emerald-400">
            "Hierarchical Multi-Stage Framework for Robust and Explainable Tomato Leaf Disease Identification"
          </p>
          <p className="text-slate-400">
            IEEE Access (2025). Digital Object Identifier: 10.1109/ACCESS.2025.IEEE_AI_CROP
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This project translates the paper’s proposed 4-stage pipeline architecture into an accessible Progressive Web Application (PWA) for real-world field deployment.
        </p>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <span>The 4-Stage Explainable AI Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Scan className="w-4 h-4 text-emerald-400" />
              <span>Stage 1: YOLO11 Leaf Detection</span>
            </div>
            <p className="text-xs text-slate-400">
              Scans input image frame to locate leaf geometry and extract spatial bounding box regions of interest (ROI), ignoring field clutter.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Stage 2: SAM Leaf Segmentation</span>
            </div>
            <p className="text-xs text-slate-400">
              Uses Segment Anything Model (SAM) zero-shot prompts to remove background soil, weeds, and shadows, isolating precise leaf margins.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Stage 3: ResNet-50 Disease Classifier</span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates deep convolutional feature maps against fine-tuned pathogen weights to predict specific disease class and severity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Stage 4: LIME Visual Explainability</span>
            </div>
            <p className="text-xs text-slate-400">
              Generates superpixel feature importance heatmaps showing farmers exactly which spots and halos triggered the neural classification.
            </p>
          </div>

        </div>
      </div>

      <div className="bg-amber-950/20 p-6 rounded-3xl border border-amber-900/40 space-y-3">
        <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Decision-Support System Disclaimer</span>
        </h3>

        <p className="text-xs text-amber-200/90 leading-relaxed">
          AgriVision AI is built strictly as an agricultural decision-support tool. Artificial intelligence model predictions are intended to assist farmers and agronomists in early diagnosis. They do not replace certified agricultural extension officers or laboratory diagnostic testing.
        </p>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-xs text-slate-400 space-y-3">
        <h4 className="font-bold text-white text-sm">Project Architecture & ONNX Edge Model</h4>
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
          <p className="font-semibold text-emerald-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Active ONNX Edge Engine Loaded</span>
          </p>
          <code className="block bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-400 border border-slate-800">
            public/models/tomato_disease_mobilenetv3.onnx
          </code>
          <p className="text-[11px] text-slate-300">
            Inference engine: <strong className="text-white">ONNX Runtime Web (WASM/WebGL)</strong>. Executes quantized MobileNetV3 tensor graph directly on client devices without requiring cloud API servers.
          </p>
        </div>
        <p className="text-slate-400">
          ✓ <strong className="text-emerald-400">Milestone 1:</strong> PWA foundation, mobile camera scanner, ONNX edge model loader, pipeline service abstraction, LIME heatmap overlays, and offline sync.
        </p>
      </div>

    </div>
  );
};
