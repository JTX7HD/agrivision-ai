import React, { useState, useEffect, useRef } from "react";
import {
  Leaf, Camera, Upload, Home, LayoutGrid, ScanLine, History as HistoryIcon,
  Info, ChevronRight, ArrowRight, Menu, X,
  FlaskConical, ClipboardCheck, RotateCcw,
  FileText, Download, ExternalLink
} from "lucide-react";
import type { CropId, FullAnalysisResult, ScanItem, PipelineStageStatus } from "./models/types";
import { CROPS_DATA, getCropById } from "./data/cropsData";
import { analyzeLeafPipeline } from "./services/aiService";
import { clearModelSessionCache } from "./services/onnx/modelLoader";
import { useScanHistory } from "./hooks/useScanHistory";
import { useCameraStream } from "./hooks/useCameraStream";
import { DiseaseResultCard } from "./components/result/DiseaseResultCard";
import { PipelineVisualizer } from "./components/analysis/PipelineVisualizer";
import { TrainingControlPanel } from "./components/dashboard/TrainingControlPanel";
import { I18nProvider, useTranslation } from "./i18n/i18nContext";
import { LanguageSelector } from "./components/common/LanguageSelector";
import type { TranslationDictionary } from "./i18n/types";

/* ---------------------------------------------------------
   DESIGN TOKENS
   forest   – deep agricultural green, primary actions
   leaf     – lighter working green, secondary accents
   cream    – page background
   sand     – card / surface background
   brown    – earthy accent, moderate-severity, dividers
   rust     – severe-severity only
   olive    – muted supporting tone
   ink      – body text
--------------------------------------------------------- */
const C = {
  forest: "#28421F",
  forestDark: "#1C2F16",
  leaf: "#5C7A3F",
  leafLight: "#7C9A5A",
  cream: "#FAF7EF",
  sand: "#F0E9D8",
  sandDark: "#E4DABF",
  brown: "#8A6A45",
  rust: "#A6503A",
  olive: "#84815A",
  ink: "#28271F",
  inkSoft: "#5A5647",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600&display=swap');`;

/* ---------------------------------------------------------
   SIGNATURE ELEMENTS
--------------------------------------------------------- */
function VeinDivider({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 400 24"
      className="w-full h-6"
      style={{ transform: flip ? "scaleX(-1)" : "none" }}
      preserveAspectRatio="none"
    >
      <path
        d="M0 12 Q 40 2, 80 12 T 160 12 T 240 12 T 320 12 T 400 12"
        fill="none"
        stroke={C.leafLight}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {[40, 120, 200, 280, 360].map((x, i) => (
        <path
          key={i}
          d={`M${x} 12 L${x - 8} 6 M${x} 12 L${x + 8} 18`}
          stroke={C.leafLight}
          strokeWidth="1"
          opacity="0.4"
        />
      ))}
    </svg>
  );
}

function LeafMark({ size = 28, color = C.forest }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 26C6 14 14 6 26 6C26 18 18 26 6 26Z"
        fill={color}
      />
      <path d="M8 24C13 18 17 14 24 8" stroke={C.cream} strokeWidth="1.3" opacity="0.7" />
    </svg>
  );
}



const LanguageSwitcher = LanguageSelector;

function getNavItems(t: TranslationDictionary) {
  return [
    { id: "home", label: t.nav.home, icon: Home },
    { id: "dashboard", label: t.nav.dashboard, icon: LayoutGrid },
    { id: "scan", label: t.nav.scan, icon: ScanLine },
    { id: "history", label: t.nav.history, icon: HistoryIcon },
    { id: "about", label: t.nav.about, icon: Info },
  ];
}

/* ---------------------------------------------------------
   NAVIGATION
--------------------------------------------------------- */
function TopNav({ view, setView }: { view: string; setView: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{ background: C.cream, borderColor: C.sandDark }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setView("home")}
        >
          <LeafMark size={24} />
          <span className="font-bold text-lg tracking-tight" style={{ color: C.ink, fontFamily: "Manrope" }}>
            AgriVision <span style={{ color: C.leaf }}>AI</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
                style={{
                  color: view === item.id ? C.cream : C.inkSoft,
                  background: view === item.id ? C.forest : "transparent",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <a
            href="/AgriVision_AI_Project_Report.pdf"
            download="AgriVision_AI_Project_Report.pdf"
            title="Download Official 56-Page Capstone Project Report (PDF)"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm hover:opacity-90"
            style={{ background: C.sand, borderColor: C.sandDark, color: C.forest }}
          >
            <Download size={13} />
            <span>Report PDF</span>
          </a>
          <LanguageSwitcher />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="p-2 cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-3 flex flex-col gap-1" style={{ borderColor: C.sandDark }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setOpen(false); }}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium"
              style={{
                color: view === item.id ? C.forest : C.inkSoft,
                background: view === item.id ? C.sand : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
          <a
            href="/AgriVision_AI_Project_Report.pdf"
            download="AgriVision_AI_Project_Report.pdf"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold mt-1"
            style={{ background: C.forest, color: C.cream }}
            onClick={() => setOpen(false)}
          >
            <Download size={15} />
            <span>Download Project Report (PDF)</span>
          </a>
        </div>
      )}
    </header>
  );
}

function BottomNav({ view, setView }: { view: string; setView: (v: string) => void }) {
  const { t } = useTranslation();
  const navItems = getNavItems(t);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex justify-around py-2"
      style={{ background: C.cream, borderColor: C.sandDark }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer"
          >
            <Icon size={20} color={active ? C.forest : C.olive} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-medium" style={{ color: active ? C.forest : C.olive }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------------------------------------------------
   HOME / LANDING
--------------------------------------------------------- */
function HomeView({ setView }: { setView: (v: string) => void }) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: C.leaf }}>
            {t.home.badge}
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: C.ink, fontFamily: "Manrope" }}
          >
            {t.home.heroTitle}
          </h1>
          <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: C.inkSoft }}>
            {t.home.heroDesc}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setView("scan")}
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              style={{ background: C.forest, color: C.cream }}
            >
              <Camera size={17} /> {t.home.scanCropBtn}
            </button>
            <button
              onClick={() => setView("about")}
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm border hover:bg-slate-100/50 cursor-pointer"
              style={{ borderColor: C.olive, color: C.ink }}
            >
              {t.home.howItWorksBtn}
            </button>
          </div>
        </div>

        {/* Original illustration */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ background: C.forest, minHeight: 320 }}>
          <svg viewBox="0 0 400 340" className="w-full h-full absolute inset-0">
            <rect width="400" height="340" fill={C.forest} />
            <path d="M0 260 Q100 230 200 260 T400 260 V340 H0 Z" fill={C.forestDark} />
            {[70, 150, 230, 310].map((x, i) => (
              <g key={i} transform={`translate(${x} ${255 - (i % 2) * 8})`}>
                <path d="M0 0 C -14 -40 -6 -80 0 -110 C 6 -80 14 -40 0 0 Z" fill={C.leafLight} opacity="0.9" />
                <path d="M0 -10 L0 -95" stroke={C.forest} strokeWidth="1.2" opacity="0.5" />
              </g>
            ))}
            <circle cx="330" cy="55" r="34" fill={C.leafLight} opacity="0.25" />
          </svg>
          <div className="absolute bottom-5 left-5 right-5 bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 shadow-lg">
            <p className="text-xs font-semibold flex items-center justify-between" style={{ color: C.cream }}>
              <span>{t.home.sampleDetected}</span>
              <span className="font-bold text-emerald-300">{t.home.sampleConfidence}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><VeinDivider /></div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.home.howItWorksTitle}</h2>
        <p className="text-sm mb-8" style={{ color: C.inkSoft }}>{t.home.howItWorksSubtitle}</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: "01", t: t.home.step1Title, d: t.home.step1Desc, icon: Camera },
            { n: "02", t: t.home.step2Title, d: t.home.step2Desc, icon: ScanLine },
            { n: "03", t: t.home.step3Title, d: t.home.step3Desc, icon: FlaskConical },
            { n: "04", t: t.home.step4Title, d: t.home.step4Desc, icon: ClipboardCheck },
          ].map((s) => (
            <div key={s.n} className="p-5 rounded-xl border border-amber-950/10 shadow-sm" style={{ background: C.sand }}>
              <div className="flex items-center justify-between mb-4">
                <s.icon size={20} color={C.forest} />
                <span className="text-xs font-semibold" style={{ color: C.olive }}>{s.n}</span>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: C.ink }}>{s.t}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported crops */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.home.supportedCropsTitle}</h2>
        <p className="text-sm mb-8" style={{ color: C.inkSoft }}>{t.home.supportedCropsSubtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CROPS_DATA.map((c) => {
            const isSupported = c.supported;
            return (
              <button
                key={c.id}
                disabled={!isSupported}
                onClick={() => isSupported && setView("scan")}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group ${
                  isSupported ? "hover:border-emerald-700 cursor-pointer" : "opacity-60 cursor-not-allowed border-dashed"
                }`}
                style={{ borderColor: isSupported ? C.sandDark : "#cbd5e1", background: isSupported ? C.cream : "#f8fafc" }}
              >
                {!isSupported && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-[8px] font-bold text-amber-800 rounded-full uppercase tracking-tight">
                    Soon
                  </span>
                )}
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform" style={{ background: C.sand }}>
                  {c.icon}
                </div>
                <span className="text-sm font-semibold" style={{ color: C.ink }}>
                  {t.crops[c.id as keyof typeof t.crops] || c.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto rounded-2xl px-8 py-10 text-center shadow-lg" style={{ background: C.forest }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.cream, fontFamily: "Manrope" }}>
            {t.home.readyTitle}
          </h2>
          <p className="text-sm mb-6" style={{ color: "#D8E0CC" }}>{t.home.readySubtitle}</p>
          <button
            onClick={() => setView("scan")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
            style={{ background: C.cream, color: C.forest }}
          >
            {t.home.scanCropBtn} <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */
function DashboardView({
  setView,
  scans,
  onSelectScan
}: {
  setView: (v: string) => void;
  scans: ScanItem[];
  onSelectScan: (scan: ScanItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.dashboard.title}</h1>
      <p className="text-sm mb-8" style={{ color: C.inkSoft }}>{t.dashboard.subtitle}</p>

      <button
        onClick={() => setView("scan")}
        className="w-full flex items-center justify-between p-6 rounded-2xl mb-8 text-left shadow-md transition-all active:scale-[0.99] cursor-pointer"
        style={{ background: C.forest }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#3A5730" }}>
            <Camera size={22} color={C.cream} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: C.cream }}>{t.dashboard.scanLeaf}</p>
            <p className="text-xs" style={{ color: "#C9D3B8" }}>{t.dashboard.scanLeafSub}</p>
          </div>
        </div>
        <ChevronRight size={20} color={C.cream} />
      </button>

      <div className="mb-8">
        <h2 className="font-semibold mb-3" style={{ color: C.ink }}>{t.dashboard.selectCropToScan}</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {CROPS_DATA.map((c) => (
            <button
              key={c.id}
              onClick={() => setView("scan")}
              className="shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-xl border border-sandDark hover:border-emerald-700 transition-colors cursor-pointer"
              style={{ background: C.sand }}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-semibold" style={{ color: C.ink }}>
                {t.crops[c.id as keyof typeof t.crops] || c.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{ color: C.ink }}>{t.dashboard.recentChecks}</h2>
          <button onClick={() => setView("history")} className="text-sm font-medium cursor-pointer" style={{ color: C.leaf }}>
            {t.dashboard.seeAll}
          </button>
        </div>
        <div className="rounded-xl border divide-y shadow-sm overflow-hidden" style={{ borderColor: C.sandDark, background: C.cream }}>
          {scans.slice(0, 5).map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectScan(s)}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-100/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={s.imageUrl}
                  alt={s.diseaseName}
                  className="w-10 h-10 rounded-lg object-cover border border-sandDark shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.ink }}>{s.cropName} · {s.diseaseName}</p>
                  <p className="text-xs" style={{ color: C.inkSoft }}>
                    {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {s.confidence}% {t.dashboard.match}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {s.confidenceLevel || 'High'} {t.dashboard.confidence}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Correction Learning & Training Control */}
      <div className="mt-10">
        <TrainingControlPanel />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   SCAN VIEW
--------------------------------------------------------- */
function ScanView({
  selectedCropId,
  onSelectCrop,
  selectedImage,
  onImageSelected,
  onStartAnalysis
}: {
  selectedCropId: CropId;
  onSelectCrop: (cropId: CropId) => void;
  selectedImage: string | null;
  onImageSelected: (img: string | null) => void;
  onStartAnalysis: () => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    capturePhoto
  } = useCameraStream();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          onImageSelected(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const photo = capturePhoto();
    if (photo) {
      onImageSelected(photo);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 pb-24 md:pb-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.scan.title}</h1>
        <p className="text-sm" style={{ color: C.inkSoft }}>
          {t.scan.subtitle}
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>
          {t.scan.step1}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CROPS_DATA.map((c) => {
            const isSelected = selectedCropId === c.id;
            const isSupported = c.supported;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!isSupported}
                onClick={() => isSupported && onSelectCrop(c.id)}
                className={`relative p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  !isSupported
                    ? "opacity-50 cursor-not-allowed border-dashed"
                    : isSelected
                    ? "border-2 shadow-sm font-bold cursor-pointer"
                    : "opacity-80 cursor-pointer"
                }`}
                style={{
                  borderColor: isSelected ? C.forest : isSupported ? C.sandDark : "#cbd5e1",
                  background: isSelected ? C.sand : isSupported ? C.cream : "#f8fafc"
                }}
              >
                {!isSupported && (
                  <span className="absolute -top-1.5 px-1 py-0.2 bg-amber-100 border border-amber-300 text-[8px] font-bold text-amber-800 rounded-full uppercase tracking-tight">
                    Soon
                  </span>
                )}
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs" style={{ color: C.ink }}>
                  {t.crops[c.id as keyof typeof t.crops] || c.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>
          {t.scan.step2}
        </label>

        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-700 max-h-72 flex items-center justify-center shadow-lg">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover max-h-72" />
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleCapture}
                className="w-14 h-14 rounded-full bg-white border-4 border-emerald-600 shadow-xl flex items-center justify-center active:scale-95 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-6 mb-2 overflow-hidden shadow-inner"
            style={{ borderColor: C.sandDark, background: C.sand, minHeight: 240 }}
          >
            {selectedImage ? (
              <div className="relative w-full flex items-center justify-center">
                <img src={selectedImage} alt="Selected leaf" className="max-h-60 rounded-lg object-contain shadow-md" />
                <button
                  type="button"
                  onClick={() => onImageSelected(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm" style={{ background: C.cream }}>
                  <Leaf size={22} color={C.leaf} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: C.ink }}>{t.scan.noPhoto}</p>
                <p className="text-xs max-w-xs" style={{ color: C.inkSoft }}>{t.scan.photoAdvice}</p>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {cameraError && (
        <div className="p-3 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs">
          {cameraError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          style={{ background: C.forest, color: C.cream }}
        >
          <Camera size={17} /> {t.scan.openCamera}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm border hover:bg-slate-100 cursor-pointer"
          style={{ borderColor: C.olive, color: C.ink }}
        >
          <Upload size={17} /> {t.scan.uploadPhoto}
        </button>
      </div>

      <div className="pt-2">
        <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: C.inkSoft }}>
          {t.scan.orSelectDemo}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Tomato Blight", crop: "tomato", url: "/samples/tomato_sample.jpg" },
            { name: "Potato Early Blight", crop: "potato", url: "/samples/potato_sample.jpg" },
            { name: "Chilli Bacterial Spot", crop: "chilli", url: "/samples/chilli_sample.jpg" }
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectCrop(sample.crop as CropId);
                onImageSelected(sample.url);
              }}
              className="p-2 rounded-xl border flex flex-col items-center gap-1 bg-white hover:border-emerald-600 transition-colors shadow-sm cursor-pointer"
              style={{ borderColor: C.sandDark }}
            >
              <img src={sample.url} alt={sample.name} className="w-10 h-10 rounded-md object-cover" />
              <span className="text-[10px] font-semibold" style={{ color: C.ink }}>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!selectedImage}
        onClick={onStartAnalysis}
        className="w-full py-3.5 rounded-lg font-semibold text-sm shadow-md disabled:opacity-40 transition-all active:scale-98 cursor-pointer"
        style={{ background: C.ink, color: C.cream }}
      >
        {t.scan.checkLeafBtn}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------
   ANALYSIS VIEW
--------------------------------------------------------- */
function AnalysisView({
  selectedImage,
  cropId,
  onDone,
  onError
}: {
  selectedImage: string;
  cropId: CropId;
  onDone: (result: FullAnalysisResult) => void;
  onError: () => void;
}) {
  const crop = getCropById(cropId);
  const [stages, setStages] = useState<PipelineStageStatus[]>([
    {
      id: 'quality',
      name: '1. Image Quality Inspection',
      modelName: 'Quality Check',
      description: 'Verifying lighting, focus, and leaf contrast...',
      status: 'idle',
      durationMs: 120
    },
    {
      id: 'detection',
      name: '2. YOLO Leaf Detection & ROI',
      modelName: 'YOLO-Ready Detector',
      description: 'Scanning image frame to detect leaf bounding box geometry...',
      status: 'idle',
      durationMs: 80
    },
    {
      id: 'segmentation',
      name: '3. SAM Leaf Segmentation',
      modelName: 'SAM-Ready Segmenter',
      description: 'Isolating leaf margins and suppressing background soil/shadows...',
      status: 'idle',
      durationMs: 90
    },
    {
      id: 'onnx',
      name: '4. MobileNetV3 Disease Classification',
      modelName: 'best_tomato_mobilenetv3_v2.pth',
      description: 'Evaluating Float32 tensor [1, 3, 224, 224] via client-side WASM runtime...',
      status: 'idle',
      durationMs: 450
    },
    {
      id: 'lime',
      name: '5. LIME Visual Explainability',
      modelName: 'LIME Attribution Engine',
      description: 'Computing superpixel feature importance heatmaps...',
      status: 'idle',
      durationMs: 110
    }
  ]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isSubscribed = true;

    const executePipeline = async () => {
      try {
        const result = await analyzeLeafPipeline(selectedImage, cropId, (updatedStage) => {
          if (!isSubscribed) return;
          setStages((prevStages) => {
            const index = prevStages.findIndex((s) => s.id === updatedStage.id);
            if (index !== -1) {
              const updated = [...prevStages];
              updated[index] = { ...updatedStage };
              return updated;
            }
            return [...prevStages, updatedStage];
          });
        });

        if (isSubscribed) {
          setTimeout(() => {
            onDone(result);
          }, 400);
        }
      } catch (err) {
        if (!isSubscribed) return;
        const errMsg = err instanceof Error ? err.message : 'Analysis failed. Please select a clearer leaf photo.';
        setAnalysisError(errMsg);
      }
    };

    executePipeline();

    return () => {
      isSubscribed = false;
    };
  }, [selectedImage, cropId, onDone, retryCount]);

  if (analysisError) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <FlaskConical size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "Manrope" }}>
          Analysis Warning
        </h3>
        <p className="text-sm text-slate-400 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 leading-relaxed">
          {analysisError}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              clearModelSessionCache();
              setAnalysisError(null);
              setRetryCount((c) => c + 1);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            <span>Retry Analysis</span>
          </button>
          <button
            onClick={onError}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            Select Another Image
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PipelineVisualizer crop={crop} imageUrl={selectedImage} stages={stages} />
    </div>
  );
}

/* ---------------------------------------------------------
   RESULTS VIEW
--------------------------------------------------------- */
function ResultsView({
  result,
  setView
}: {
  result: FullAnalysisResult | null;
  setView: (v: string) => void;
}) {
  const { t } = useTranslation();

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center space-y-4">
        <p className="text-sm" style={{ color: C.inkSoft }}>{t.history.noHistory}</p>
        <button
          onClick={() => setView("scan")}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer"
          style={{ background: C.forest, color: C.cream }}
        >
          {t.nav.scan}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DiseaseResultCard
        result={result}
        onScanAnother={() => setView('scan')}
        onGoToDashboard={() => setView('dashboard')}
      />
    </div>
  );
}

/* ---------------------------------------------------------
   HISTORY VIEW
--------------------------------------------------------- */
function HistoryView({
  scans,
  onSelectScan
}: {
  scans: ScanItem[];
  onSelectScan: (scan: ScanItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.history.title}</h1>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>{t.history.subtitle}</p>
      {scans.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-sandDark bg-white/50 text-sm" style={{ color: C.inkSoft }}>
          {t.history.noHistory}
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden shadow-sm" style={{ borderColor: C.sandDark, background: C.cream }}>
          {scans.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectScan(s)}
              className="flex items-center justify-between px-4 py-4 hover:bg-slate-100/60 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img src={s.imageUrl} alt={s.diseaseName} className="w-11 h-11 rounded-lg object-cover border border-sandDark shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{s.cropName}</p>
                  <p className="text-xs" style={{ color: C.inkSoft }}>{s.diseaseName} · {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {s.confidenceLevel || 'High'} {t.dashboard.confidence}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   ABOUT VIEW
--------------------------------------------------------- */
function AboutView() {
  const { t } = useTranslation();
  const pipeline = ["Farmer Image", "Leaf Detection", "Leaf Segmentation", "Disease Classification", "Farmer Guidance"];

  return (
    <div className="max-w-3xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>{t.about.title}</h1>
      <p className="text-sm leading-relaxed mb-10" style={{ color: C.inkSoft }}>
        {t.about.desc}
      </p>

      <h2 className="font-semibold mb-3" style={{ color: C.ink }}>Crop Coverage & Roadmap</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {CROPS_DATA.map((crop) => {
          const isSupported = crop.supported;
          return (
            <div
              key={crop.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                isSupported ? "shadow-sm" : "border-dashed opacity-75"
              }`}
              style={{
                borderColor: isSupported ? C.sandDark : "#cbd5e1",
                background: isSupported ? C.cream : "#f8fafc"
              }}
            >
              <div>
                <div className="text-2xl mb-1">{crop.icon}</div>
                <p className="text-sm font-bold" style={{ color: C.ink }}>
                  {t.crops[crop.id as keyof typeof t.crops] || crop.name}
                </p>
                <p className="text-[11px] italic" style={{ color: C.olive }}>
                  {crop.scientificName}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: isSupported ? C.sandDark : "#e2e8f0" }}>
                {isSupported ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.sand, color: C.forest }}>
                    {crop.commonDiseasesCount} Diseases Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="font-semibold mb-4" style={{ color: C.ink }}>{t.about.howScanWorks}</h2>
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {pipeline.map((p, i) => (
          <React.Fragment key={p}>
            <span className="px-3 py-2 rounded-lg text-xs font-semibold shadow-sm border border-sandDark" style={{ background: C.sand, color: C.ink }}>{p}</span>
            {i < pipeline.length - 1 && <ChevronRight size={14} color={C.olive} />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="font-semibold mb-3" style={{ color: C.ink }}>{t.about.methodology}</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { t: "YOLO11", d: "Locates the leaf within the photo." },
          { t: "SAM", d: "Segments the leaf from its background." },
          { t: "Disease Classifier", d: "Identifies the likely condition." },
          { t: "LIME", d: "Explains which regions drove the result." },
        ].map((m) => (
          <div key={m.t} className="p-4 rounded-xl border shadow-sm" style={{ borderColor: C.sandDark, background: C.cream }}>
            <p className="text-sm font-semibold mb-1" style={{ color: C.forest }}>{m.t}</p>
            <p className="text-xs" style={{ color: C.inkSoft }}>{m.d}</p>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl border border-sandDark mb-6" style={{ background: C.sand }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.olive }}>{t.about.researchBasis}</p>
        <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>
          {t.about.researchDesc}
        </p>
      </div>

      <div className="p-6 rounded-2xl border shadow-sm" style={{ background: C.cream, borderColor: C.sandDark }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} color={C.forest} />
          <h2 className="font-bold text-base" style={{ color: C.ink }}>Official Project Report & Technical Specifications</h2>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: C.inkSoft }}>
          The complete 56-page B.Tech Capstone Academic Project Report submitted to APJ Abdul Kalam Technological University (KTU), detailing requirements, literature survey, 3-tier architecture, MobileNetV3/YOLO26 models, optical quality gating, and LIME explainability.
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href="/AgriVision_AI_Project_Report.pdf"
            download="AgriVision_AI_Project_Report.pdf"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:opacity-90"
            style={{ background: C.forest, color: C.cream }}
          >
            <Download size={15} />
            Download Capstone Report (PDF, 3.76 MB)
          </a>
          <a
            href="/project_report.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-amber-100/50"
            style={{ borderColor: C.sandDark, color: C.ink, background: C.sand }}
          >
            <ExternalLink size={15} />
            View Interactive A4 Report
          </a>
          <a
            href="/AgriVision_AI_Implementation_Report.md"
            download="AgriVision_AI_Implementation_Report.md"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-stone-100"
            style={{ borderColor: C.sandDark, color: C.inkSoft, background: "transparent" }}
          >
            <FileText size={15} />
            Technical Spec (Markdown)
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT APPLICATION
--------------------------------------------------------- */
function AgriVisionAppContent() {
  const [view, setView] = useState("home");
  const [selectedCropId, setSelectedCropId] = useState<CropId>("tomato");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<FullAnalysisResult | null>(null);

  const { scans, addScanFromResult } = useScanHistory();

  const handleStartAnalysis = () => {
    if (!selectedImage) return;
    setActiveResult(null);
    setView("analysis");
  };

  const handleAnalysisDone = (result: FullAnalysisResult) => {
    setActiveResult(result);
    addScanFromResult(result);
    setView("results");
  };

  const handleSelectScan = (scan: ScanItem) => {
    if (scan.fullResult) {
      setActiveResult(scan.fullResult);
    } else {
      setActiveResult({
        scanId: scan.id,
        timestamp: scan.timestamp,
        crop: getCropById(scan.cropId),
        predictedClassIndex: 1,
        predictedClassName: 'Tomato___Early_blight',
        disease: {
          id: 'tomato-early-blight',
          cropId: scan.cropId,
          name: scan.diseaseName,
          scientificName: scan.scientificName,
          description: scan.summary,
          commonSymptoms: [scan.summary],
          generalManagement: ['Maintain regular watering and good ventilation.'],
          preventativeMeasures: ['Practice 2-year crop rotation.']
        },
        imageUrl: scan.imageUrl,
        pipelineStages: [],
        confidence: scan.confidence,
        confidenceLevel: scan.confidenceLevel || 'High',
        confidenceLabel: 'High-confidence model prediction',
        classProbabilities: [
          { classIndex: 1, className: 'Tomato___Early_blight', displayName: scan.diseaseName, probability: scan.confidence }
        ],
        rawLogits: [0, 2.5, 0, 0, 0, 0, 0, 0, 0, 0],
        imageQuality: { isSuitable: true },
        isMockPrediction: false
      });
    }
    setView("results");
  };

  return (
    <div style={{ background: C.cream, minHeight: "100vh", fontFamily: "'Source Sans 3', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      {view !== "analysis" && <TopNav view={view} setView={setView} />}

      {view === "home" && <HomeView setView={setView} />}
      {view === "dashboard" && <DashboardView setView={setView} scans={scans} onSelectScan={handleSelectScan} />}
      {view === "scan" && (
        <ScanView
          selectedCropId={selectedCropId}
          onSelectCrop={setSelectedCropId}
          selectedImage={selectedImage}
          onImageSelected={setSelectedImage}
          onStartAnalysis={handleStartAnalysis}
        />
      )}
      {view === "analysis" && selectedImage && (
        <AnalysisView
          selectedImage={selectedImage}
          cropId={selectedCropId}
          onDone={handleAnalysisDone}
          onError={() => setView("scan")}
        />
      )}
      {view === "results" && <ResultsView result={activeResult} setView={setView} />}
      {view === "history" && <HistoryView scans={scans} onSelectScan={handleSelectScan} />}
      {view === "about" && <AboutView />}

      {view !== "analysis" && <BottomNav view={view} setView={setView} />}
    </div>
  );
}

export default function AgriVisionAI() {
  return (
    <I18nProvider>
      <AgriVisionAppContent />
    </I18nProvider>
  );
}
