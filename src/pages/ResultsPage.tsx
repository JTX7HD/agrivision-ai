import React from 'react';
import type { FullAnalysisResult } from '../models/types';
import { DiseaseResultCard } from '../components/result/DiseaseResultCard';

interface ResultsPageProps {
  result: FullAnalysisResult | null;
  onScanAnother: () => void;
  onGoToDashboard: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onScanAnother,
  onGoToDashboard
}) => {
  if (!result) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">No Active Analysis Result</h2>
        <p className="text-sm text-slate-400">Please select a crop and scan a leaf image first.</p>
        <button
          onClick={onScanAnother}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
        >
          Go to Leaf Scanner
        </button>
      </div>
    );
  }

  return (
    <DiseaseResultCard
      result={result}
      onScanAnother={onScanAnother}
      onGoToDashboard={onGoToDashboard}
    />
  );
};
