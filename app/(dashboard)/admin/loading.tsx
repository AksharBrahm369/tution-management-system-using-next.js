import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          {/* Breadcrumb skeleton */}
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          {/* Title skeleton */}
          <div className="h-8 w-48 rounded bg-slate-300 dark:bg-slate-700" />
          {/* Subtitle skeleton */}
          <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        {/* Buttons skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-32 rounded-lg bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-3"
          >
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-16 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3 w-28 rounded bg-slate-100 dark:bg-slate-800/40" />
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Left Side: Main Data Table/Card Placeholder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-36 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-3.5 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Shimmering Table Rows */}
          <div className="space-y-3.5 pt-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-300 dark:bg-slate-700" />
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-12 rounded bg-slate-100 dark:bg-slate-850" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Details/Sidebar Card Placeholder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-5">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Large block illustration placeholder */}
          <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800/40 flex flex-col justify-end p-4 space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-32 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-3.5 w-44 rounded bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
