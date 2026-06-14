'use client';

import React from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const FinancialHealth: React.FC = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="h-full min-h-[330px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-3 h-4 w-44" />
        <Skeleton className="h-[190px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="h-full min-h-[330px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Financial Health</h3>
        <p className="mt-3 text-sm text-red-600 dark:text-red-300">Could not load financial records.</p>
      </div>
    );
  }

  const collected = stats.feeCollected ?? stats.monthlyCollection ?? 0;
  const pending = stats.pendingFees ?? 0;
  const total = collected + pending;
  const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;
  const isHealthy = collectionRate >= 80;

  return (
    <section className="flex h-full min-h-[330px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex min-h-8 items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800/60">
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

      <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/60">
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Collected</span>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Rs. {collected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Pending</span>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            Rs. {pending.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Collection %</span>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {collectionRate}%
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-2 rounded-l-full bg-emerald-500"
            style={{ width: `${collectionRate}%` }}
            title={`Collected: ${collectionRate}%`}
          />
          <div
            className="h-2 rounded-r-full bg-amber-500"
            style={{ width: `${100 - collectionRate}%` }}
            title={`Pending: ${100 - collectionRate}%`}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Collected (Rs. {collected.toLocaleString('en-IN')})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pending (Rs. {pending.toLocaleString('en-IN')})
          </span>
        </div>
      </div>
    </section>
  );
};

export default FinancialHealth;
