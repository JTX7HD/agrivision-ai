import React from 'react';
import { Leaf, ShieldAlert } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1 */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-slate-950">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-white">AgriVision AI</span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            A decision-support mobile web application for farmers, enabling rapid plant disease detection using computer vision and explainable artificial intelligence.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-amber-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Academic Interim Review 1 Prototype • Simulated IEEE 4-Stage AI Pipeline</span>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('/')} className="hover:text-emerald-400">Home</button></li>
            <li><button onClick={() => onNavigate('/dashboard')} className="hover:text-emerald-400">Farmer Dashboard</button></li>
            <li><button onClick={() => onNavigate('/scan')} className="hover:text-emerald-400">Scan Leaf</button></li>
            <li><button onClick={() => onNavigate('/history')} className="hover:text-emerald-400">Scan History</button></li>
            <li><button onClick={() => onNavigate('/about')} className="hover:text-emerald-400">IEEE Research Paper</button></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Supported Prototype Crops</h4>
          <p className="text-xs text-slate-400 mb-2">Tomato • Potato • Maize • Rice • Banana • Chilli</p>
          <p className="text-xs text-slate-500">Designed for mobile smartphone browsers in field environments.</p>
        </div>

      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        AgriVision AI © 2025 • Computer Science Final Year Project • IEEE Access 2025 Framework
      </div>
    </footer>
  );
};
