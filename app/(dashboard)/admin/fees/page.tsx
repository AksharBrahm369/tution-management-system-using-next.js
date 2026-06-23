"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// fetch is performed inside the component so we can handle redirects on 401

export default function FeesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fees", { credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load fees dashboard");
      }
      setData(payload);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load fees dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!confirm("Generate fees for current month for all active students?")) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/fees/generate", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to generate fees");
      }
      const payload = await res.json();
      alert(`Generated ${payload.created} fee records`);
      load();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error generating fees");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fee Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage student fees and payments</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => router.push("/admin/fees/collect")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition active:scale-95 shadow-md">Collect Fee</button>
        <button onClick={generate} disabled={generating} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95">{generating ? "Generating..." : "Generate Monthly Fees"}</button>
        <button onClick={() => alert("Send reminders TODO")} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95">Send Reminders</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-3/4"></div>
                <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded-sm w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition active:scale-95 shadow-md"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30">
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Fees Due This Month</div>
              <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹{data.totalDue?.toLocaleString("en-IN") ?? 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30">
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Collected This Month</div>
              <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹{data.totalCollected?.toLocaleString("en-IN") ?? 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30">
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Amount</div>
              <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">₹{data.pendingAmount?.toLocaleString("en-IN") ?? 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/30">
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overdue Amount</div>
              <div className="text-2xl font-bold mt-2 text-slate-950 dark:text-white">₹{data.overdueAmount?.toLocaleString("en-IN") ?? 0}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-slate-400">No data found</div>
          </div>
        )}
      </div>
    </div>
  );
}

