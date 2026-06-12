'use client';

import React from 'react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

const TodayAttendanceStatus: React.FC = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Skeleton className="mb-3 h-4 w-44" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Today&apos;s Attendance Status</h3>
        <p className="text-sm text-red-600 dark:text-red-300">Could not load attendance.</p>
      </div>
    );
  }

  const attendance = stats.todayAttendance ?? 0;
  const isHealthy = attendance >= 75;

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Today&apos;s Attendance Status
        </h3>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {attendance}%
        </span>
        <div className="flex flex-col justify-center">
          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
            isHealthy 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400' 
              : 'bg-red-50 text-red-700 border border-red-200/60 dark:bg-red-950/20 dark:text-red-400'
          }`}>
            {isHealthy ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {isHealthy ? 'Healthy Rate' : 'Needs Attention'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {/* Visual progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-800">
          <div 
            className={`h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${attendance}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Daily attendance targets are set at 75%. Currently {isHealthy ? 'above' : 'below'} standard threshold.
        </p>
      </div>
    </div>
  );
};

export default TodayAttendanceStatus;
