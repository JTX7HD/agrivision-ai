import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  iconBgClass: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  iconBgClass
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorClass}`}>
          {value}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgClass} shrink-0`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );
};
