import React from 'react';
import { Home, LayoutDashboard, Scan, History, Info } from 'lucide-react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPath, onNavigate }) => {
  const items = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan Leaf', path: '/scan', icon: Scan, isPrimary: true },
    { label: 'History', path: '/history', icon: History },
    { label: 'About', path: '/about', icon: Info }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          if (item.isPrimary) {
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-600/40 border-4 border-slate-900 group-active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400 mt-0.5">Scan</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
