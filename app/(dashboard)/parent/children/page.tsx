"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/parent/children");
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch children data");
        }
        const json = await res.json();
        setChildren(json.children);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/20 space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/20 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/20 space-y-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (children.length === 0) {
    return <div className="p-8 text-center text-slate-500">No children linked to this account.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Children</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your children's performance and status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {children.map((child: any) => (
          <div key={child.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="border-b border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {child.firstName} {child.lastName}
                  </h2>
                  <p className="text-sm text-slate-500">{child.studentCode}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <BookOpen size={16} />
                    <span className="text-xs font-semibold uppercase">Batch</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {child.batchEnrollments?.[0]?.batch?.name || "No Batch"}
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase">Attendance</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {child.attendancePercent ?? 0}%
                  </div>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/30">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <CreditCard size={16} />
                    <span className="text-xs font-semibold uppercase">Fees</span>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                    {child.feeRecords?.length > 0
                      ? `${child.feeRecords.length} Pending`
                      : "All Paid"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
