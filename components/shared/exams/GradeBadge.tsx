import React from "react";

const colors: Record<string, string> = {
  "A+": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  A: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "B+": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  B: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  C: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  D: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  F: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function GradeBadge({ grade }: { grade?: string | null }) {
  const label = grade || "Pending";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[label] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{label}</span>;
}
