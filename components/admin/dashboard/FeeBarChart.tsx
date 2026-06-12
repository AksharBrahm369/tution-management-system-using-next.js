'use client';

import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeasuredChartSize } from './useMeasuredChartSize';

interface ChartData {
  monthlyFeeCollection: Array<{
    month: string;
    collected: number;
    pending: number;
  }>;
}

const FeeBarChart: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'6' | '12'>('6');
  const [chartRef, chartSize] = useMeasuredChartSize(240);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery<ChartData>({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (!mounted || isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-4 h-4 w-44" />
        <Skeleton className="h-[240px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Fee Collection</h2>
        <p className="mt-4 text-xs text-red-600 dark:text-red-300">Could not load chart data.</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Fee Collection</h2>
        </div>
        <select
          aria-label="Fee collection period"
          value={period}
          onChange={(event) => setPeriod(event.target.value as '6' | '12')}
          className="h-8 rounded border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-none outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        >
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </div>

      <div ref={chartRef} className="h-[240px] min-h-[240px] w-full min-w-0 overflow-hidden">
        {chartSize.isReady ? (
          <BarChart
            width={chartSize.width}
            height={chartSize.height}
            data={data?.monthlyFeeCollection || []}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-800" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
              }}
              itemStyle={{ color: '#ffffff' }}
              formatter={(value) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN')}`}
            />
            <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : null}
      </div>
    </section>
  );
};

export default FeeBarChart;
