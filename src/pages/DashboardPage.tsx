import React from 'react';
import type { ScanItem, CropId } from '../models/types';
import { MetricCard } from '../components/dashboard/MetricCard';
import { RecentScansList } from '../components/dashboard/RecentScansList';
import { Scan, Activity, CheckCircle2, AlertTriangle, Sprout, Plus } from 'lucide-react';
import { CROPS_DATA } from '../data/cropsData';

interface DashboardPageProps {
  scans: ScanItem[];
  onNavigate: (path: string) => void;
  onSelectScan: (scan: ScanItem) => void;
  onSelectCropAndScan: (cropId: CropId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  scans,
  onNavigate,
  onSelectScan,
  onSelectCropAndScan
}) => {
  const totalScans = scans.length;
  const healthyScans = scans.filter((s) => s.severity === 'Healthy').length;
  const actionNeededScans = scans.filter((s) => s.severity === 'Moderate' || s.severity === 'Severe').length;

  return (
    <div className="space-y-8 pb-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-emerald-800/40 shadow-xl">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Farmer Field Assistant
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to AgriVision Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            Monitor crop health scans, view recent field diagnoses, and perform quick leaf AI inspections.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/scan')}
          className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <Scan className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          <span>Scan New Leaf</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Scans Logged"
          value={totalScans}
          subtitle="Saved in local app memory"
          icon={Activity}
          colorClass="text-emerald-400"
          iconBgClass="bg-emerald-500/10 border border-emerald-500/20"
        />

        <MetricCard
          title="Healthy Leaves"
          value={healthyScans}
          subtitle="No pathogen detected"
          icon={CheckCircle2}
          colorClass="text-green-400"
          iconBgClass="bg-green-500/10 border border-green-500/20"
        />

        <MetricCard
          title="Action Needed"
          value={actionNeededScans}
          subtitle="Moderate or severe lesions"
          icon={AlertTriangle}
          colorClass="text-amber-400"
          iconBgClass="bg-amber-500/10 border border-amber-500/20"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <span>Quick Crop Scanner</span>
          </h3>
          <span className="text-xs text-slate-400">Click crop to initiate scan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CROPS_DATA.map((crop) => (
            <button
              key={crop.id}
              onClick={() => onSelectCropAndScan(crop.id)}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 transition-all text-left flex items-center gap-3 group active:scale-95"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {crop.icon}
              </span>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white truncate">{crop.name}</h4>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <Plus className="w-3 h-3" /> Scan
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Recent Crop Inspections</span>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-md border border-slate-700">
              {scans.length}
            </span>
          </h3>
          <button
            onClick={() => onNavigate('/history')}
            className="text-xs text-emerald-400 font-bold hover:underline"
          >
            View All History
          </button>
        </div>

        <RecentScansList scans={scans.slice(0, 5)} onSelectScan={onSelectScan} />
      </div>

    </div>
  );
};
