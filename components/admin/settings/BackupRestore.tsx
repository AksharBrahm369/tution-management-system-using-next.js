"use client";

import { useState } from "react";
import { Download, RotateCcw, Upload, Database } from "lucide-react";
import type { BackupRecord } from "./types";

interface Props { backups: BackupRecord[]; onChanged: () => void; }

export default function BackupRestore({ backups, onChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const createBackup = async () => {
    setCreating(true);
    try {
      await fetch("/api/admin/settings/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "MANUAL" }) });
      onChanged();
    } finally { setCreating(false); }
  };

  const restore = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/admin/settings/restore", { method: "POST", body: formData });
      onChanged();
    } finally { setUploading(false); }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Backup & Restore</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create snapshots and restore settings from a backup file.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2"><Database size={18} className="text-blue-600" /><h4 className="font-semibold text-slate-900 dark:text-white">Manual Backup</h4></div>
          <p className="mt-2 text-sm text-slate-500">Create a settings snapshot for quick recovery.</p>
          <button onClick={createBackup} disabled={creating} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"><Download size={16} /> {creating ? "Creating..." : "Create Backup Now"}</button>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2"><RotateCcw size={18} className="text-blue-600" /><h4 className="font-semibold text-slate-900 dark:text-white">Restore</h4></div>
          <p className="mt-2 text-sm text-slate-500">Upload a backup file to restore settings and academic years.</p>
          <div className="mt-4 flex flex-col gap-3">
            <input type="file" accept="application/json" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <button onClick={restore} disabled={!file || uploading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200 disabled:opacity-60"><Upload size={16} /> {uploading ? "Restoring..." : "Restore from Backup"}</button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Backup History</h4>
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-950/50">
              <tr><th className="px-4 py-3">File Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Download</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {backups.map((backup) => (
                <tr key={backup.id} className="text-slate-700 dark:text-slate-300">
                  <td className="px-4 py-3">{backup.fileName}</td><td className="px-4 py-3">{backup.type}</td><td className="px-4 py-3">{backup.fileSize ?? "-"}</td><td className="px-4 py-3">{new Date(backup.createdAt).toLocaleString()}</td><td className="px-4 py-3">{backup.status}</td><td className="px-4 py-3"><a href={backup.fileUrl ?? "#"} className="text-blue-600 hover:underline">Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}