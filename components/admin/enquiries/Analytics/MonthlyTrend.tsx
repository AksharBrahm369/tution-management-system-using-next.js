"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthlyTrendProps {
  data: Array<{ month: string; enquiries: number; conversions: number }>;
  conversionRate: { thisMonth: number; lastMonth: number; bestMonth: number; bestMonthName: string } | null;
}

export default function MonthlyTrend({ data, conversionRate }: MonthlyTrendProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Monthly Trend</h3>
          {conversionRate ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This month {conversionRate.thisMonth}% | Best {conversionRate.bestMonthName} {conversionRate.bestMonth}%</p> : null}
        </div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="enquiries" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
