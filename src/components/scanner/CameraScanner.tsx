import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon, Sparkles, X, Sun, Eye, Target } from 'lucide-react';
import { useCameraStream } from '../../hooks/useCameraStream';
import type { Crop } from '../../models/types';

interface CameraScannerProps {
  selectedCrop: Crop;
  selectedImage: string | null;
  onImageSelected: (imageDataUrl: string | null) => void;
  onStartAnalysis: () => void;
}

const SAMPLE_LEAF_IMAGES = [
  {
    id: 'sample-1',
    title: 'Tomato Leaf (Blight Spot)',
    cropId: 'tomato',
    url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sample-2',
    title: 'Potato Leaf (Lesion)',
    cropId: 'potato',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sample-3',
    title: 'Maize Leaf (Rust Rustles)',
    cropId: 'maize',
    url: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80'
  }
];

export const CameraScanner: React.FC<CameraScannerProps> = ({
  selectedCrop,
  selectedImage,
  onImageSelected,
  onStartAnalysis
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    videoRef,
    isCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    toggleFacingMode,
    capturePhoto
  } = useCameraStream();

  const handleFileSelect = (file: File) => {
    setValidationError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setValidationError('Invalid file format. Please upload a JPEG, PNG, or WEBP leaf photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Image size is too large (> 10 MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelected(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleCapture = () => {
    const photoDataUrl = capturePhoto();
    if (photoDataUrl) {
      onImageSelected(photoDataUrl);
    }
  };

  return (
    <div className="space-y-6">
      
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Step 2: Capture or Upload Leaf Image</span>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            {selectedCrop.icon} {selectedCrop.name} Selected
          </span>
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Take a close-up photo of the affected leaf or select an image file from your smartphone.
        </p>
      </div>

      <div className="bg-gradient-to-r from-emerald-900/20 via-green-900/10 to-slate-900/40 p-4 rounded-2xl border border-emerald-800/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Photo Quality Guidance for High AI Accuracy
          </h4>
          <span className="text-[11px] font-mono text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            ONNX: public/models/tomato_disease_mobilenetv3.onnx
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Good natural lighting (avoid dark shadows)</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Center single leaf in frame</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <Eye className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Sharp focus on affected leaf spots</span>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{validationError}</span>
        </div>
      )}

      {selectedImage ? (
        <div className="space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500/50 shadow-xl group max-h-[420px] flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Selected crop leaf preview"
              className="max-h-[420px] w-full object-contain bg-slate-950"
            />

            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>Image Ready for AI Analysis</span>
            </div>

            <button
              onClick={() => onImageSelected(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white hover:bg-red-600 transition-colors backdrop-blur-md"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onStartAnalysis}
              className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
              <span>Analyze Leaf with AI Pipeline</span>
            </button>

            <button
              onClick={() => onImageSelected(null)}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Change Image</span>
            </button>
          </div>
        </div>

      ) : isCameraActive ? (
        <div className="space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-emerald-500 shadow-2xl max-h-[420px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[420px] object-cover"
            />

            <div className="absolute inset-0 border-[3px] border-dashed border-emerald-400/40 m-6 rounded-2xl pointer-events-none flex items-center justify-center">
              <span className="text-xs text-emerald-300 bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                Align leaf inside frame
              </span>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 px-4">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-slate-700 hover:bg-slate-800"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleCapture}
                className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-xl flex items-center justify-center active:scale-90 transition-transform"
                title="Capture Photo"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500" />
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="p-3 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-slate-700 hover:bg-red-600"
                title="Close Camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      ) : (
        <div className="space-y-5">
          {cameraError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl">
              {cameraError}
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-950/40">
              <Camera className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Capture or Upload Leaf Photo
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              Drag & drop an image file here, or use your smartphone camera to take a clear picture in the field.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={startCamera}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Open Mobile Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload File from Device</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Or Select Quick Demo Sample Leaf
              </span>
              <span className="text-[11px] text-slate-400">For fast testing</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_LEAF_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onImageSelected(sample.url)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-all text-left group active:scale-95 shadow-sm"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {sample.title}
                    </h5>
                    <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
                      Click to test
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
