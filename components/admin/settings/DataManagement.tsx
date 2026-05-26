"use client";

import { useState } from "react";
import { Trash2, Download, ShieldAlert } from "lucide-react";

export default function DataManagement() {
  const [confirm, setConfirm] = useState("");
  const [purgeDays, setPurgeDays] = useState("90");
  const [busy, setBusy] = useState<string | null>(null);

  const exportData = async () => {
    const response = await fetch("/api/admin/settings/export");
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tuitionpro-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearTestData = async () => {
    if (confirm !== "DELETE") return;
    setBusy("clear");
    try {
      await fetch("/api/admin/settings/data-management/clear-test-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
      setConfirm("");
    } finally {
      setBusy(null);
    }
  };

  const purgeOldRecords = async () => {
    setBusy("purge");
    try {
      await fetch("/api/admin/settings/data-management/purge-old-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ days: Number(purgeDays) }) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20">
      <div>
        <h3 className="text-xl font-semibold text-rose-900 dark:text-rose-100">Data Management</h3>
        <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-200/80">Danger zone for cleanup and export operations.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard title="Clear Test Data" description="Remove all seed/test data added during setup." icon={<Trash2 size={18} />} actionLabel={busy === "clear" ? "Deleting..." : "Delete"} onAction={clearTestData} actionDisabled={confirm !== "DELETE" || busy === "clear"} />
        <ActionCard title="Export All Data" description="Download all institute data as JSON." icon={<Download size={18} />} actionLabel="Export" onAction={exportData} />
          <div className="rounded-2xl border border-rose-200 bg-white p-5 dark:border-rose-900/40 dark:bg-slate-950/40">
            <div className="flex items-center gap-3"><span className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"><ShieldAlert size={18} /></span><h4 className="font-semibold text-slate-900 dark:text-white">Purge Old Records</h4></div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Delete attendance and log records older than a chosen number of days.</p>
            <div className="mt-4 grid gap-3">
              <input type="number" min="1" value={purgeDays} onChange={(event) => setPurgeDays(event.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
              <button onClick={purgeOldRecords} disabled={busy === "purge"} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{busy === "purge" ? "Purging..." : "Purge"}</button>
            </div>
          </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-white p-4 dark:border-rose-900/40 dark:bg-slate-950/40">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Type DELETE to confirm</label>
        <input value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <p className="mt-2 text-xs text-slate-500">This action is available only when you type DELETE and click Delete.</p>
      </div>
    </section>
  );
}

function ActionCard({ title, description, icon, actionLabel, onAction, actionDisabled }: { title: string; description: string; icon: React.ReactNode; actionLabel: string; onAction: () => void; actionDisabled?: boolean }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 dark:border-rose-900/40 dark:bg-slate-950/40">
      <div className="flex items-center gap-3"><span className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{icon}</span><h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4></div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <button onClick={onAction} disabled={actionDisabled} className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{actionLabel}</button>
    </div>
  );
}