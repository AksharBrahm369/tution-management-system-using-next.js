"use client";

import { AlertTriangle, Lock, Settings, ShieldAlert } from "lucide-react";
import type { SecurityEventsResponse } from "@/types/activityLog";

interface SecurityEventsSectionProps {
  data: SecurityEventsResponse | undefined;
  isLoading: boolean;
}

export default function SecurityEventsSection({ data, isLoading }: SecurityEventsSectionProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">Loading security events…</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Failed logins today",
      value: data?.failedLoginsToday ?? 0,
      icon: ShieldAlert,
      tone: "text-red-600",
    },
    {
      label: "Account lockouts",
      value: data?.accountLockouts ?? 0,
      icon: Lock,
      tone: "text-amber-600",
    },
    {
      label: "Permission changes",
      value: data?.permissionChanges ?? 0,
      icon: AlertTriangle,
      tone: "text-orange-600",
    },
    {
      label: "Settings changes",
      value: data?.settingsChanges ?? 0,
      icon: Settings,
      tone: "text-blue-600",
    },
  ];

  return (
    <section className="animate-fade-up space-y-4 overflow-hidden rounded-2xl border border-amber-200/80 bg-linear-to-br from-amber-50/90 via-orange-50/50 to-white p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        Security Events
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90"
          >
            <div className="flex items-center gap-2 text-slate-500">
              <Icon className={`h-4 w-4 ${tone}`} />
              <span className="text-xs font-medium uppercase">{label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      {data?.suspiciousIps?.length ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          {data.suspiciousIps.map((ip) => (
            <p key={ip.ipAddress} className="text-sm font-medium text-red-800 dark:text-red-200">
              ⚠️ Multiple failed login attempts from IP: {ip.ipAddress} ({ip.count} attempts)
            </p>
          ))}
        </div>
      ) : null}

      {data?.failedLoginAttempts?.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Recent failed attempts</p>
          <ul className="space-y-2 text-sm">
            {data.failedLoginAttempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"
              >
                <span>{attempt.description}</span>
                <span className="text-xs text-slate-500">
                  {attempt.ipAddress ?? "unknown IP"} · {new Date(attempt.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
