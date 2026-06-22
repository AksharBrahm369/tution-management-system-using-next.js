import React from "react";

export default function StudentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-48 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-3"
          >
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-16 rounded bg-slate-300 dark:bg-slate-700" />
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
        <div className="h-5 w-40 rounded bg-slate-300 dark:bg-slate-700" />
        <div className="space-y-3">
          <div className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800/40" />
          <div className="h-12 w-full rounded-lg bg-slate-100 dark:bg-slate-800/40" />
        </div>
      </div>
    </div>
  );
}
