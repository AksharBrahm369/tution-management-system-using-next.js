import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo';
  change?: number;
  changeLabel?: string;
  onClick?: () => void;
}

const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    icon: 'bg-blue-100 dark:bg-blue-900/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    icon: 'bg-purple-100 dark:bg-purple-900/30',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    icon: 'bg-green-100 dark:bg-green-900/30',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    icon: 'bg-orange-100 dark:bg-orange-900/30',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    icon: 'bg-red-100 dark:bg-red-900/30',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  color,
  change,
  changeLabel,
  onClick,
}) => {
  const colors = colorClasses[color];
  const isPositive = change && change > 0;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ease-in-out dark:border-[#1F2937] dark:bg-[#111827] ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:hover:border-slate-600 dark:hover:shadow-slate-950/40' : ''
        }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 opacity-70 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
      
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </h3>
        <div className={`rounded-xl p-3 ${colors.icon}`}>
          <div className={`w-5 h-5 ${colors.text}`}>{icon}</div>
        </div>
      </div>

      <div className="relative z-10 mb-4">
        <p className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {changeLabel && change !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
              }`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(change)}%
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {changeLabel}
            </span>
          </div>
        )}
      </div>

      {onClick && (
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Click to view details →
        </div>
      )}
    </div>
  );
};

export default StatsCard;
