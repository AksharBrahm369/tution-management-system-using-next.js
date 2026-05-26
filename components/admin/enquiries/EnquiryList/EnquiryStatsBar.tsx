"use client";

import { EnquiryStats } from "../types";

interface EnquiryStatsBarProps {
  stats: EnquiryStats;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`mt-2 text-2xl font-semibold ${accent ?? "text-slate-900 dark:text-white"}`}>{value}</div>
    </div>
  );
}

export default function EnquiryStatsBar({ stats }: EnquiryStatsBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total" value={stats.total} />
      <StatCard label="New Today" value={stats.newToday} accent="text-sky-600 dark:text-sky-300" />
      <StatCard label="Follow-ups Due" value={stats.followUpsDue} accent="text-orange-600 dark:text-orange-300" />
      <StatCard label="Converted This Month" value={stats.convertedThisMonth} accent="text-emerald-600 dark:text-emerald-300" />
      <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} accent="text-cyan-600 dark:text-cyan-300" />
    </div>
  );
}
