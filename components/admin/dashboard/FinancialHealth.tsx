'use client';

import React from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

const FinancialHealth: React.FC = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-3 h-4 w-44" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Financial Health</h3>
        <p className="text-sm text-red-600 dark:text-red-300">Could not load financial records.</p>
      </div>
    );
  }

  const collected = stats.feeCollected ?? stats.monthlyCollection ?? 0;
  const pending = stats.pendingFees ?? 0;
  const total = collected + pending;
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;
  const isHealthy = collectionRate >= 80;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800/60">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Financial Health
        </h2>
        <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
          isHealthy
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400'
        }`}>
          {isHealthy ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
          {isHealthy ? 'On Track' : 'Needs Collection'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4 dark:border-slate-800/60">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Collected</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            ₹{collected.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pending</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            ₹{pending.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Collection %</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {collectionRate}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        {/* Clean stacked horizontal indicator */}
        <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden dark:bg-slate-800">
          <div 
            className="h-2 bg-emerald-500 rounded-l-full" 
            style={{ width: `${collectionRate}%` }} 
            title={`Collected: ${collectionRate}%`}
          />
          <div 
            className="h-2 bg-amber-500 rounded-r-full" 
            style={{ width: `${100 - collectionRate}%` }} 
            title={`Pending: ${100 - collectionRate}%`}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Collected (₹{collected.toLocaleString('en-IN')})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pending (₹{pending.toLocaleString('en-IN')})
          </span>
        </div>
      </div>
    </section>
  );
};

export default FinancialHealth;
