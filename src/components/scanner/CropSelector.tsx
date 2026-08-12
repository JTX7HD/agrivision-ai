import React from 'react';
import type { CropId } from '../../models/types';
import { CROPS_DATA } from '../../data/cropsData';
import { Check, Info } from 'lucide-react';

interface CropSelectorProps {
  selectedCropId: CropId;
  onSelectCrop: (cropId: CropId) => void;
}

export const CropSelector: React.FC<CropSelectorProps> = ({ selectedCropId, onSelectCrop }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Step 1: Select Your Crop</span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Required
            </span>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose the crop species for the leaf image you want to scan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {CROPS_DATA.map((crop) => {
          const isSelected = selectedCropId === crop.id;
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => onSelectCrop(crop.id)}
              className={`relative p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between group active:scale-[0.98] ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">
                  {crop.icon}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {crop.name}
                </h4>
                <p className="text-[11px] text-slate-500 italic font-medium mt-0.5">
                  {crop.scientificName}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {crop.commonDiseasesCount} Diseases
                </span>
                {crop.id === 'tomato' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    IEEE Baseline
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          <span className="font-bold">Prototype Note:</span> This UI includes crop selection for prototype testing. Full deep neural network training weights (ResNet-50) are configured with tomato as the baseline benchmark according to the IEEE Access paper.
        </p>
      </div>
    </div>
  );
};
