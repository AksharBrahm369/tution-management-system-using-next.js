'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface ChartData {
  monthlyFeeCollection: Array<{
    month: string;
    collected: number;
    pending: number;
  }>;
}

const FeeBarChart: React.FC = () => {
  const [period, setPeriod] = useState<'6' | '12'>('6');
  const { data, isLoading } = useQuery<ChartData>({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 h-80 flex flex-col items-center justify-center shadow-lg">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 animate-spin mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Monthly Fee Collection
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as '6' | '12')}
          className="text-sm px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <option value="6">Last 6 months</option>
          <option value="12">Last 12 months</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data?.monthlyFeeCollection || []}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#cbd5e1"
            className="dark:stroke-slate-700"
          />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            className="dark:stroke-slate-600"
          />
          <YAxis stroke="#94a3b8" className="dark:stroke-slate-600" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(value) => `₹ ${Number(value ?? 0).toLocaleString('en-IN')}`}
          />
          <Legend />
          <Bar dataKey="collected" fill="#3b82f6" name="Collected" radius={8} />
          <Bar dataKey="pending" fill="#ef4444" name="Pending" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FeeBarChart;
