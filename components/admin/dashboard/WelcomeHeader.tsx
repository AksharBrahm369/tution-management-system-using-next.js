'use client';

import React, { useSyncExternalStore } from 'react';
import { Calendar, Shield, GraduationCap } from 'lucide-react';

function subscribeToTimeChanges(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(timer);
}

const INDIA_TIMEZONE = 'Asia/Kolkata';

function getDateSnapshot() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

interface WelcomeHeaderProps {
  adminName?: string;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ adminName = 'Admin' }) => {
  const formattedDate = useSyncExternalStore(subscribeToTimeChanges, getDateSnapshot, () => '');

  return (
    <header className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Side: Navigation / Title / Date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TuitionPro</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <h1 className="text-base font-semibold text-slate-700 dark:text-slate-300">Dashboard</h1>
          </div>
          <span className="hidden h-5 w-px bg-slate-200 dark:bg-slate-800 sm:inline"></span>
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <Calendar size={15} className="text-slate-400" />
            <span>{formattedDate || 'June 2026'}</span>
          </div>
        </div>

        {/* Right Side: High-density Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Role Badge */}
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <Shield size={14} className="text-blue-500 dark:text-blue-400" />
            <span>{adminName}</span>
          </span>

          {/* Academic Session Badge */}
          <span className="inline-flex items-center gap-1.5 rounded bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            <GraduationCap size={14} className="text-emerald-500 dark:text-emerald-400" />
            <span>Session: 2025-26</span>
          </span>

          {/* System Status Badge */}
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50/60 px-2.5 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live</span>
          </span>
        </div>
      </div>
    </header>
  );
};

export default WelcomeHeader;
