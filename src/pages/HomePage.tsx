import React from 'react';
import { Scan, Sparkles, Sprout, ArrowRight, Camera, Cpu, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { CROPS_DATA } from '../data/cropsData';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 pb-12">
      
      <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>2025 IEEE Access Research Framework Prototype</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            AI-Powered Crop Leaf Disease Detection & <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Farmer Assistance</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Instantly identify crop leaf pathogens in the field. Powered by a 4-stage explainable computer vision framework (YOLO11, SAM, ResNet-50, and LIME) to help farmers protect yield.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/scan')}
              className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <Scan className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              <span>Scan Your Crop Now</span>
            </button>

            <button
              onClick={() => onNavigate('/dashboard')}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <span>View Farmer Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800 text-left">
            <div>
              <p className="text-xs text-slate-400 font-semibold">IEEE Framework</p>
              <p className="text-lg font-bold text-white">4 AI Stages</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Supported Crops</p>
              <p className="text-lg font-bold text-emerald-400">6 Species</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Analysis Time</p>
              <p className="text-lg font-bold text-white">&lt; 3 Seconds</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">Explainability</p>
              <p className="text-lg font-bold text-amber-400">LIME Heatmaps</p>
            </div>
          </div>

        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How AgriVision AI Works
          </h2>
          <p className="text-sm text-slate-400">
            Simple 4-step workflow designed for field usage on smartphones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              1
            </div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Capture Leaf
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take a clear picture of the symptomatic crop leaf using your smartphone camera or upload an image file.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              2
            </div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              AI Analysis
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              YOLO11 detects the leaf, SAM isolates background noise, and ResNet-50 classifies the pathogen.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              3
            </div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Disease Result
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive instant diagnosis with confidence score, severity rating, and LIME visual heatmap explanations.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
              4
            </div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              Farmer Guidance
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access actionable organic treatments, biological controls, and preventive farming recommendations.
            </p>
          </div>

        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Supported Prototype Crops
            </h2>
            <p className="text-xs text-slate-400">
              Multi-crop detection architecture extensible to regional crop varieties.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/scan')}
            className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>Scan any crop</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CROPS_DATA.map((crop) => (
            <div
              key={crop.id}
              onClick={() => onNavigate('/scan')}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group text-center space-y-2"
            >
              <div className="text-3xl group-hover:scale-110 transition-transform">
                {crop.icon}
              </div>
              <h4 className="font-bold text-white text-sm">
                {crop.name}
              </h4>
              <p className="text-[10px] text-slate-500 italic">
                {crop.scientificName}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Why AgriVision AI?
          </h2>
          <p className="text-xs text-slate-400">
            Designed specifically for agricultural decision support in rural communities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Explainable AI (XAI)</h4>
              <p className="text-slate-400">LIME visual heatmaps show farmers exactly which leaf lesions triggered the model result, building trust.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Mobile-First PWA</h4>
              <p className="text-slate-400">Installable directly on Android/iOS smartphones without app store downloads. Works in low connectivity.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm mb-1">Actionable Treatment</h4>
              <p className="text-slate-400">Provides clear, simple treatment recommendations with minimal technical jargon for quick field action.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
