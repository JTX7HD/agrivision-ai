import React, { useState } from 'react';
import type { ScanItem } from '../models/types';
import { RecentScansList } from '../components/dashboard/RecentScansList';
import { History, Search, Trash2, Filter } from 'lucide-react';
import { CROPS_DATA } from '../data/cropsData';

interface HistoryPageProps {
  scans: ScanItem[];
  onSelectScan: (scan: ScanItem) => void;
  onClearHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  scans,
  onSelectScan,
  onClearHistory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');

  const filteredScans = scans.filter((scan) => {
    const matchesCrop = selectedCropFilter === 'all' || scan.cropId === selectedCropFilter;
    const matchesQuery =
      scan.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.diseaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrop && matchesQuery;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-black text-white">Scan History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review past crop leaf disease diagnoses saved in your device storage.
          </p>
        </div>

        {scans.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all scan history?')) {
                onClearHistory();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by crop or disease name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Crops ({scans.length})</option>
            {CROPS_DATA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <RecentScansList scans={filteredScans} onSelectScan={onSelectScan} />
      </div>

    </div>
  );
};
