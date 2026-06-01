"use client";

import type { ActivityLogsStats } from "@/types/activityLog";

interface LogsStatsBarProps {
  stats: ActivityLogsStats | undefined;
  isLoading: boolean;
}

export default function LogsStatsBar({ stats, isLoading }: LogsStatsBarProps) {
  const items = [
    { label: "Total Logs Today", value: stats?.today ?? 0, className: "text-slate-900 dark:text-white" },
    { label: "Errors Today", value: stats?.errors ?? 0, className: "text-red-600" },
    { label: "Warnings Today", value: stats?.warnings ?? 0, className: "text-amber-600" },
    { label: "Failed Logins", value: stats?.failedLogins ?? 0, className: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="tp-card tp-card-interactive animate-fade-up p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-bold ${item.className}`}>
            {isLoading ? "—" : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
