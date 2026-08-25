import React, { useState, useEffect, useRef } from "react";
import {
  Leaf, Camera, Upload, Home, LayoutGrid, ScanLine, History as HistoryIcon,
  Info, ChevronRight, ArrowRight, Menu, X,
  FlaskConical, ClipboardCheck, ShieldCheck, ArrowLeft,
  Eye, Layers, Scan
} from "lucide-react";
import type { CropId, FullAnalysisResult, ScanItem } from "./models/types";
import { CROPS_DATA, getCropById } from "./data/cropsData";
import { analyzeLeafPipeline } from "./services/aiService";
import { useScanHistory } from "./hooks/useScanHistory";
import { useCameraStream } from "./hooks/useCameraStream";

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

function GrowthRing({ value, size = 132, color = C.forest }: { value: number; size?: number; color?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={C.sandDark} strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r - 14} stroke={C.sandDark} strokeWidth="1" fill="none" opacity="0.6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 900ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: C.ink, fontFamily: "Manrope" }}>{value}%</span>
        <span className="text-[11px]" style={{ color: C.inkSoft }}>confidence</span>
      </div>
    </div>
  );
}

const SEVERITY_STYLES: Record<string, { bg: string; fg: string }> = {
  Healthy: { bg: "#E7EEDC", fg: C.forest },
  Low: { bg: "#E7EEDC", fg: C.forest },
  Mild: { bg: "#F1E4CE", fg: C.brown },
  Moderate: { bg: "#F1E4CE", fg: C.brown },
  Severe: { bg: "#F0DAD3", fg: C.rust },
};

function SeverityTag({ level }: { level: string }) {
  const s = SEVERITY_STYLES[level] || SEVERITY_STYLES.Moderate;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {level} Severity
    </span>
  );
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "scan", label: "Scan", icon: ScanLine },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "about", label: "About", icon: Info },
];

/* ---------------------------------------------------------
   NAVIGATION
--------------------------------------------------------- */
function TopNav({ view, setView }: { view: string; setView: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{ background: C.cream, borderColor: C.sandDark }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button
          className="flex items-center gap-2"
          onClick={() => setView("home")}
        >
          <LeafMark size={24} />
          <span className="font-bold text-lg tracking-tight" style={{ color: C.ink, fontFamily: "Manrope" }}>
            AgriVision <span style={{ color: C.leaf }}>AI</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{
                color: view === item.id ? C.cream : C.inkSoft,
                background: view === item.id ? C.forest : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} color={C.ink} /> : <Menu size={22} color={C.ink} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t px-5 py-3 flex flex-col gap-1" style={{ borderColor: C.sandDark }}>
          {NAV_ITEMS.map((item) => (
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
        </div>
      )}
    </header>
  );
}

function BottomNav({ view, setView }: { view: string; setView: (v: string) => void }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex justify-around py-2"
      style={{ background: C.cream, borderColor: C.sandDark }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
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
  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: C.leaf }}>
            For farmers, by design
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: C.ink, fontFamily: "Manrope" }}
          >
            Know what's wrong with your crop, right from your phone.
          </h1>
          <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: C.inkSoft }}>
            Take a photo of an affected leaf and AgriVision AI checks it for disease,
            tells you how serious it is, and what to do next — in plain language.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setView("scan")}
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95"
              style={{ background: C.forest, color: C.cream }}
            >
              <Camera size={17} /> Scan Your Crop
            </button>
            <button
              onClick={() => setView("about")}
              className="flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm border hover:bg-slate-100/50"
              style={{ borderColor: C.olive, color: C.ink }}
            >
              How It Works
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
              <span>Early Blight detected — Tomato</span>
              <span className="font-bold text-emerald-300">94.2% Confidence</span>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5"><VeinDivider /></div>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>How it works</h2>
        <p className="text-sm mb-8" style={{ color: C.inkSoft }}>Four steps, no technical knowledge needed.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { n: "01", t: "Capture", d: "Take a clear photo of the affected leaf.", icon: Camera },
            { n: "02", t: "Detect", d: "AgriVision finds and isolates the leaf.", icon: ScanLine },
            { n: "03", t: "Analyze", d: "The leaf is checked for signs of disease.", icon: FlaskConical },
            { n: "04", t: "Get Guidance", d: "You get a clear result and next steps.", icon: ClipboardCheck },
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
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>Supported crops</h2>
        <p className="text-sm mb-8" style={{ color: C.inkSoft }}>Disease detection is currently available for these crops.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {CROPS_DATA.map((c) => (
            <button
              key={c.id}
              onClick={() => setView("scan")}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-emerald-700 transition-all text-center group cursor-pointer"
              style={{ borderColor: C.sandDark, background: C.cream }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform" style={{ background: C.sand }}>
                {c.icon}
              </div>
              <span className="text-sm font-semibold" style={{ color: C.ink }}>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="max-w-4xl mx-auto rounded-2xl px-8 py-10 text-center shadow-lg" style={{ background: C.forest }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: C.cream, fontFamily: "Manrope" }}>
            Ready to check on your crop?
          </h2>
          <p className="text-sm mb-6" style={{ color: "#D8E0CC" }}>It takes less than a minute.</p>
          <button
            onClick={() => setView("scan")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
            style={{ background: C.cream, color: C.forest }}
          >
            Scan Your Crop <ArrowRight size={16} />
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
  return (
    <div className="max-w-5xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>Welcome back</h1>
      <p className="text-sm mb-8" style={{ color: C.inkSoft }}>Here's how your crops are doing.</p>

      <button
        onClick={() => setView("scan")}
        className="w-full flex items-center justify-between p-6 rounded-2xl mb-8 text-left shadow-md transition-all active:scale-[0.99]"
        style={{ background: C.forest }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#3A5730" }}>
            <Camera size={22} color={C.cream} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: C.cream }}>Scan a leaf</p>
            <p className="text-xs" style={{ color: "#C9D3B8" }}>Check a crop for disease now</p>
          </div>
        </div>
        <ChevronRight size={20} color={C.cream} />
      </button>

      <div className="mb-8">
        <h2 className="font-semibold mb-3" style={{ color: C.ink }}>Select Crop to Scan</h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {CROPS_DATA.map((c) => (
            <button
              key={c.id}
              onClick={() => setView("scan")}
              className="shrink-0 flex flex-col items-center gap-2 px-5 py-4 rounded-xl border border-sandDark hover:border-emerald-700 transition-colors"
              style={{ background: C.sand }}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-xs font-semibold" style={{ color: C.ink }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{ color: C.ink }}>Recent checks</h2>
          <button onClick={() => setView("history")} className="text-sm font-medium" style={{ color: C.leaf }}>See all</button>
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
                    {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {s.confidence}% match
                  </p>
                </div>
              </div>
              <SeverityTag level={s.severity} />
            </div>
          ))}
        </div>
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
        <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>Check a leaf</h1>
        <p className="text-sm" style={{ color: C.inkSoft }}>
          Select your crop and take a clear photo of the affected leaf in good lighting.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>
          Step 1: Select Crop
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CROPS_DATA.map((c) => {
            const isSelected = selectedCropId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCrop(c.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  isSelected ? "border-2 shadow-sm font-bold" : "opacity-80"
                }`}
                style={{
                  borderColor: isSelected ? C.forest : C.sandDark,
                  background: isSelected ? C.sand : C.cream
                }}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs" style={{ color: C.ink }}>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>
          Step 2: Capture or Upload Image
        </label>

        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-700 max-h-72 flex items-center justify-center shadow-lg">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover max-h-72" />
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleCapture}
                className="w-14 h-14 rounded-full bg-white border-4 border-emerald-600 shadow-xl flex items-center justify-center active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600" />
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md"
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
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm" style={{ background: C.cream }}>
                  <Leaf size={22} color={C.leaf} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: C.ink }}>No photo selected yet</p>
                <p className="text-xs max-w-xs" style={{ color: C.inkSoft }}>Center the affected leaf and avoid shadows for the clearest result.</p>
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
          className="flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm shadow-md transition-all active:scale-95"
          style={{ background: C.forest, color: C.cream }}
        >
          <Camera size={17} /> Open Camera
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-sm border hover:bg-slate-100"
          style={{ borderColor: C.olive, color: C.ink }}
        >
          <Upload size={17} /> Upload Photo
        </button>
      </div>

      <div className="pt-2">
        <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: C.inkSoft }}>
          Or Select Demo Sample Leaf
        </span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: "Tomato Blight", crop: "tomato", url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=600&q=80" },
            { name: "Potato Lesion", crop: "potato", url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80" },
            { name: "Maize Rust", crop: "maize", url: "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80" }
          ].map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectCrop(sample.crop as CropId);
                onImageSelected(sample.url);
              }}
              className="p-2 rounded-xl border flex flex-col items-center gap-1 bg-white hover:border-emerald-600 transition-colors shadow-sm"
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
        Check this leaf with AI Pipeline
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
  onDone
}: {
  selectedImage: string;
  cropId: CropId;
  onDone: (result: FullAnalysisResult) => void;
}) {
  const steps = [
    { name: "Stage 1: YOLO11 Leaf Detection", desc: "Locating crop leaf geometry & spatial bounding box..." },
    { name: "Stage 2: SAM Leaf Segmentation", desc: "Isolating leaf contour and removing soil background..." },
    { name: "Stage 3: ResNet-50 Disease Classification", desc: "Evaluating deep convolutional features against pathogen database..." },
    { name: "Stage 4: LIME Explainability", desc: "Generating superpixel feature importance heatmap..." }
  ];
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    let isSubscribed = true;

    const executePipeline = async () => {
      const result = await analyzeLeafPipeline(selectedImage, cropId, (stage) => {
        if (!isSubscribed) return;
        if (stage.id === 'yolo11') setStageIndex(0);
        if (stage.id === 'sam') setStageIndex(1);
        if (stage.id === 'resnet50') setStageIndex(2);
        if (stage.id === 'lime') setStageIndex(3);
      });

      if (isSubscribed) {
        setTimeout(() => {
          onDone(result);
        }, 600);
      }
    };

    executePipeline();

    return () => {
      isSubscribed = false;
    };
  }, [selectedImage, cropId, onDone]);

  return (
    <div className="max-w-md mx-auto px-5 py-20 flex flex-col items-center text-center">
      <div className="relative w-24 h-24 mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: "2.2s" }}>
          <circle cx="50" cy="50" r="40" stroke={C.sandDark} strokeWidth="5" fill="none" />
          <path
            d="M50 10 A40 40 0 0 1 90 50"
            stroke={C.forest}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf size={30} color={C.leaf} />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>
        Checking your crop leaf...
      </h3>
      <p className="text-xs font-semibold text-emerald-700 mb-2">
        {steps[stageIndex]?.name}
      </p>
      <p className="text-xs max-w-xs text-slate-500">
        {steps[stageIndex]?.desc}
      </p>
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
  const [activeTab, setActiveTab] = useState<'lime' | 'sam' | 'yolo' | 'raw'>('lime');

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center space-y-4">
        <p className="text-sm" style={{ color: C.inkSoft }}>No scan result selected.</p>
        <button
          onClick={() => setView("scan")}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm"
          style={{ background: C.forest, color: C.cream }}
        >
          Go to Scan
        </button>
      </div>
    );
  }

  const { crop, disease, imageUrl, yoloBoundingBox, limeFeatures } = result;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <button onClick={() => setView("scan")} className="flex items-center gap-1.5 text-sm font-medium mb-6" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> New scan
      </button>

      <div className="rounded-2xl p-6 mb-6 flex items-center gap-6 flex-wrap shadow-sm border border-sandDark" style={{ background: C.sand }}>
        <GrowthRing value={disease.confidence} />
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: C.olive }}>{crop.name} • {crop.scientificName}</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>{disease.name}</h1>
          <SeverityTag level={disease.severity} />
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-6 border space-y-3" style={{ borderColor: C.sandDark, background: C.cream }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: C.ink }}>
            <Eye size={16} color={C.forest} />
            Visual Explainability Overlays
          </h3>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sand border border-sandDark" style={{ color: C.inkSoft }}>
            LIME + SAM
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sand text-xs font-semibold">
          <button
            onClick={() => setActiveTab('lime')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${activeTab === 'lime' ? 'bg-forest text-cream font-bold' : ''}`}
          >
            <Eye size={13} /> LIME Heatmap
          </button>
          <button
            onClick={() => setActiveTab('sam')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${activeTab === 'sam' ? 'bg-forest text-cream font-bold' : ''}`}
          >
            <Layers size={13} /> SAM Segment
          </button>
          <button
            onClick={() => setActiveTab('yolo')}
            className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 ${activeTab === 'yolo' ? 'bg-forest text-cream font-bold' : ''}`}
          >
            <Scan size={13} /> YOLO11 Box
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-slate-900 max-h-64 flex items-center justify-center border border-sandDark">
          <img src={imageUrl} alt="Disease visualization" className="w-full max-h-64 object-contain" />

          {activeTab === 'yolo' && yoloBoundingBox && (
            <div
              className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded-lg pointer-events-none"
              style={{
                left: `${yoloBoundingBox.x}%`,
                top: `${yoloBoundingBox.y}%`,
                width: `${yoloBoundingBox.width}%`,
                height: `${yoloBoundingBox.height}%`
              }}
            >
              <span className="absolute -top-5 left-0 text-[9px] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                YOLO11 ROI
              </span>
            </div>
          )}

          {activeTab === 'lime' && limeFeatures && (
            <div className="absolute inset-0 pointer-events-none">
              {limeFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="absolute rounded-full border border-amber-400 bg-amber-500/40 animate-pulse flex items-center justify-center"
                  style={{
                    left: `${feat.x}%`,
                    top: `${feat.y}%`,
                    width: `${feat.radius * 2}%`,
                    height: `${feat.radius * 2}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span className="text-[8px] font-mono font-bold bg-black/80 text-amber-300 px-1 py-0.5 rounded">
                    LIME ROI: {(feat.importanceScore * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-5 rounded-xl border" style={{ borderColor: C.sandDark }}>
          <div className="flex items-center gap-2 mb-2">
            <ScanLine size={16} color={C.forest} />
            <h3 className="font-semibold text-sm" style={{ color: C.ink }}>What we found</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{disease.description}</p>
        </div>

        <div className="p-5 rounded-xl border" style={{ borderColor: C.sandDark }}>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck size={16} color={C.forest} />
            <h3 className="font-semibold text-sm" style={{ color: C.ink }}>Recommended action</h3>
          </div>
          <ul className="space-y-1.5 text-sm list-disc list-inside" style={{ color: C.inkSoft }}>
            {disease.immediateAction.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>

        <div className="p-5 rounded-xl border" style={{ borderColor: C.sandDark }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} color={C.forest} />
            <h3 className="font-semibold text-sm" style={{ color: C.ink }}>Prevention & Cultural Practices</h3>
          </div>
          <ul className="space-y-1.5 text-sm list-disc list-inside" style={{ color: C.inkSoft }}>
            {disease.prevention.map((prev, i) => (
              <li key={i}>{prev}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={() => setView("dashboard")}
        className="w-full mt-6 py-3.5 rounded-lg font-semibold text-sm shadow-md cursor-pointer"
        style={{ background: C.forest, color: C.cream }}
      >
        Done
      </button>
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
  return (
    <div className="max-w-2xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-1" style={{ color: C.ink, fontFamily: "Manrope" }}>Scan history</h1>
      <p className="text-sm mb-6" style={{ color: C.inkSoft }}>A record of every crop leaf checked.</p>
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
            <SeverityTag level={s.severity} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ABOUT VIEW
--------------------------------------------------------- */
function AboutView() {
  const pipeline = ["Farmer Image", "Leaf Detection", "Leaf Segmentation", "Disease Classification", "Farmer Guidance"];
  return (
    <div className="max-w-3xl mx-auto px-5 py-10 pb-24 md:pb-10">
      <h1 className="text-2xl font-bold mb-2" style={{ color: C.ink, fontFamily: "Manrope" }}>About AgriVision AI</h1>
      <p className="text-sm leading-relaxed mb-10" style={{ color: C.inkSoft }}>
        AgriVision AI helps farmers identify crop disease early using computer vision,
        so problems can be treated before they spread.
      </p>

      <h2 className="font-semibold mb-4" style={{ color: C.ink }}>How a scan works</h2>
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {pipeline.map((p, i) => (
          <React.Fragment key={p}>
            <span className="px-3 py-2 rounded-lg text-xs font-semibold shadow-sm border border-sandDark" style={{ background: C.sand, color: C.ink }}>{p}</span>
            {i < pipeline.length - 1 && <ChevronRight size={14} color={C.olive} />}
          </React.Fragment>
        ))}
      </div>

      <h2 className="font-semibold mb-3" style={{ color: C.ink }}>Methodology</h2>
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

      <div className="p-5 rounded-xl border border-sandDark" style={{ background: C.sand }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.olive }}>Research basis (IEEE Access 2025)</p>
        <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>
          "Hierarchical Multi-Stage Framework for Robust and Explainable Tomato Leaf Disease Identification." 
          Built as an agricultural decision-support tool for smallholder farmers.
        </p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT APPLICATION
--------------------------------------------------------- */
export default function AgriVisionAI() {
  const [view, setView] = useState("home");
  const [selectedCropId, setSelectedCropId] = useState<CropId>("tomato");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<FullAnalysisResult | null>(null);

  const { scans, addScanFromResult } = useScanHistory();

  const handleStartAnalysis = () => {
    if (!selectedImage) return;
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
        disease: {
          id: 'hist-disease',
          cropId: scan.cropId,
          name: scan.diseaseName,
          scientificName: scan.scientificName,
          severity: scan.severity,
          confidence: scan.confidence,
          description: scan.summary,
          symptoms: [scan.summary],
          immediateAction: [scan.recommendationSnippet],
          prevention: ['Maintain good farm sanitation and morning root watering.']
        },
        imageUrl: scan.imageUrl,
        pipelineStages: [],
        yoloBoundingBox: scan.yoloBoundingBox,
        samSegmentationDataUrl: scan.imageUrl,
        samSuccess: true,
        limeFeatures: scan.limeFeatures || [],
        limeHeatmapDataUrl: scan.imageUrl,
        limeSuccess: true,
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
        />
      )}
      {view === "results" && <ResultsView result={activeResult} setView={setView} />}
      {view === "history" && <HistoryView scans={scans} onSelectScan={handleSelectScan} />}
      {view === "about" && <AboutView />}

      {view !== "analysis" && <BottomNav view={view} setView={setView} />}
    </div>
  );
}
