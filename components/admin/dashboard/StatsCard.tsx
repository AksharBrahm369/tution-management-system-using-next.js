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

const colorClasses: Record<
  string,
  { gradient: string; icon: string; glow: string }
> = {
  blue: {
    gradient: 'from-blue-500/10 to-cyan-500/5',
    icon: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    glow: 'group-hover:shadow-blue-500/10',
  },
  purple: {
    gradient: 'from-violet-500/10 to-purple-500/5',
    icon: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    glow: 'group-hover:shadow-violet-500/10',
  },
  green: {
    gradient: 'from-emerald-500/10 to-teal-500/5',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  orange: {
    gradient: 'from-amber-500/10 to-orange-500/5',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    glow: 'group-hover:shadow-amber-500/10',
  },
  red: {
    gradient: 'from-red-500/10 to-rose-500/5',
    icon: 'bg-red-500/15 text-red-600 dark:text-red-400',
    glow: 'group-hover:shadow-red-500/10',
  },
  indigo: {
    gradient: 'from-indigo-500/10 to-violet-500/5',
    icon: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    glow: 'group-hover:shadow-indigo-500/10',
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
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 ease-out dark:border-slate-800/80 dark:bg-slate-900/90 ${
        onClick
          ? `cursor-pointer tp-card-interactive hover:shadow-xl ${colors.glow}`
          : 'tp-card'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${colors.gradient} opacity-80`}
      />
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />

      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </h3>
        <div className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${colors.icon}`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {changeLabel && change !== undefined && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
              }`}
            >
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{changeLabel}</span>
          </div>
        )}
      </div>

      {onClick && (
        <p className="relative z-10 mt-4 text-xs font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-indigo-400">
          View details →
        </p>
      )}
    </div>
  );
};

export default StatsCard;
