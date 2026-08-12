import React from 'react';
import type { CropId } from '../models/types';
import { getCropById } from '../data/cropsData';
import { CropSelector } from '../components/scanner/CropSelector';
import { CameraScanner } from '../components/scanner/CameraScanner';

interface ScanPageProps {
  selectedCropId: CropId;
  onSelectCrop: (cropId: CropId) => void;
  selectedImage: string | null;
  onImageSelected: (imageDataUrl: string | null) => void;
  onStartAnalysis: () => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({
  selectedCropId,
  onSelectCrop,
  selectedImage,
  onImageSelected,
  onStartAnalysis
}) => {
  const selectedCrop = getCropById(selectedCropId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Plant Leaf Scanner
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Select your crop and take a clear photo of the symptomatic leaf for instant AI disease identification.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <CropSelector
          selectedCropId={selectedCropId}
          onSelectCrop={onSelectCrop}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <CameraScanner
          selectedCrop={selectedCrop}
          selectedImage={selectedImage}
          onImageSelected={onImageSelected}
          onStartAnalysis={onStartAnalysis}
        />
      </div>

    </div>
  );
};
