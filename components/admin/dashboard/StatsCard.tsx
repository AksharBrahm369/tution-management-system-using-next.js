import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo';
  change?: number;
  changeLabel?: string;
  onClick?: () => void;
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
  purple: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
  orange: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
  red: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50',
  indigo: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
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
  const isPositive = Boolean(change && change > 0);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => event.key === 'Enter' && onClick() : undefined}
      className={`group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900 ${
        onClick ? 'cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/70' : ''
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</h3>
        <div className={`rounded-lg p-2.5 ring-1 ring-inset ${colorClasses[color]}`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
      </div>

      <p className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {changeLabel && change !== undefined ? (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50'
                : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50'
            }`}
          >
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change)}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{changeLabel}</span>
        </div>
      ) : changeLabel ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{changeLabel}</p>
      ) : null}

      {onClick ? (
        <p className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-300">
          View details
        </p>
      ) : null}
    </div>
  );
};

export default StatsCard;
