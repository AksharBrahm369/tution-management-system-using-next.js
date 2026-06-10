"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// fetch is performed inside the component so we can handle redirects on 401

export default function FeesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees", { credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        // session expired or not logged in
        router.push("/auth/login");
        return;
      }
      if (!res.ok) {
        throw new Error(payload.error || "Failed to load fees dashboard");
      }
      setData(payload);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to load");
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

      <div className="flex gap-3">
        <button onClick={() => router.push("/admin/fees/collect")} className="rounded-xl bg-blue-600 px-4 py-2 text-white">Collect Fee</button>
        <button onClick={generate} disabled={generating} className="rounded-xl border px-4 py-2">{generating ? "Generating..." : "Generate Monthly Fees"}</button>
        <button onClick={() => alert("Send reminders TODO")} className="rounded-xl border px-4 py-2">Send Reminders</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        {loading ? (
          <div>Loading...</div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4">
              <div className="text-sm text-slate-500">Total Fees Due This Month</div>
              <div className="text-xl font-bold">₹{data.totalDue}</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-slate-500">Total Collected This Month</div>
              <div className="text-xl font-bold">₹{data.totalCollected}</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-slate-500">Pending Amount</div>
              <div className="text-xl font-bold">₹{data.pendingAmount}</div>
            </div>
            <div className="p-4">
              <div className="text-sm text-slate-500">Overdue Amount</div>
              <div className="text-xl font-bold">₹{data.overdueAmount}</div>
            </div>
          </div>
        ) : (
          <div>No data</div>
        )}
      </div>
    </div>
  );
}

