import React from 'react';
import { Leaf, Scan, LayoutDashboard, History, Info, Home } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scan Leaf', path: '/scan', icon: Scan },
    { label: 'History', path: '/history', icon: History },
    { label: 'About Project', path: '/about', icon: Info }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-emerald-800/40 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-900/50 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">AgriVision</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  AI 2025
                </span>
              </div>
              <p className="text-[10px] text-emerald-300/80 font-medium hidden sm:block">
                Multi-Crop Plant Disease Decision Support
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Primary Mobile/Desktop CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/scan')}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all active:scale-95"
            >
              <Scan className="w-4 h-4 text-slate-950" />
              <span>Scan Crop</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
