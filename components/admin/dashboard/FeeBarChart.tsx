'use client';

import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-5 h-5 w-48" />
        <Skeleton className="h-[320px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly Fee Collection</h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load chart data.</p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly Fee Collection</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Collected and pending amounts</p>
        </div>
        <select
          aria-label="Fee collection period"
          value={period}
          onChange={(event) => setPeriod(event.target.value as '6' | '12')}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        >
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </div>

      <div className="h-[320px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data?.monthlyFeeCollection || []}
            margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} width={48} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
                boxShadow: '0 8px 20px -16px rgba(15, 23, 42, 0.35)',
              }}
              formatter={(value) => `Rs. ${Number(value ?? 0).toLocaleString('en-IN')}`}
            />
            <Legend />
            <Bar dataKey="collected" fill="#10b981" name="Collected" radius={[6, 6, 0, 0]} />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default FeeBarChart;
