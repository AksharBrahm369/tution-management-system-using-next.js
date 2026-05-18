import React from "react";

const statusClass: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ENTERED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  VERIFIED: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  PUBLISHED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  PASS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  FAIL: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  ABSENT: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

export default function ResultStatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[status] ?? statusClass.PENDING}`}>{status.replace("_", " ")}</span>;
}
