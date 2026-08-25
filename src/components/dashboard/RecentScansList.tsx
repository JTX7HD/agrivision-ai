import React from 'react';
import type { ScanItem } from '../../models/types';
import { Clock, ChevronRight } from 'lucide-react';

interface RecentScansListProps {
  scans: ScanItem[];
  onSelectScan: (scan: ScanItem) => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
  scans,
  onSelectScan
}) => {
  if (scans.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
        <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-white mb-1">No Scan History Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Scan your first crop leaf image to see disease diagnoses recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scans.map((scan) => {
        const dateStr = new Date(scan.timestamp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div
            key={scan.id}
            onClick={() => onSelectScan(scan)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={scan.imageUrl}
                alt={scan.diseaseName}
                className="w-13 h-13 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 group-hover:scale-105 transition-transform"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {scan.cropName} • {scan.diseaseName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {dateStr}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-500">
                    {scan.confidence}% Match
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  scan.confidenceLevel === 'High'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                }`}
              >
                {scan.confidenceLevel || 'High'} Confidence
              </span>

              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
