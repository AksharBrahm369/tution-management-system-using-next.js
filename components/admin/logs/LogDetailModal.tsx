"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActivityLogRow } from "@/types/activityLog";

interface LogDetailModalProps {
  log: ActivityLogRow | null;
  onClose: () => void;
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</p>
      <pre className="max-h-40 overflow-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{log.action}</h2>
            <p className="text-sm text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">{log.description}</p>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">User</dt>
            <dd className="font-medium">{log.userName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd>{log.userRole ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd>{log.category}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Severity</dt>
            <dd>{log.severity}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Entity</dt>
            <dd>{log.entityName ?? log.entityType ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd>{log.isSuccessful ? "Success" : "Failed"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">IP Address</dt>
            <dd className="font-mono text-xs">{log.ipAddress ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-slate-500">User Agent</dt>
            <dd className="break-all text-xs text-slate-600">{log.userAgent ?? "—"}</dd>
          </div>
          {log.errorMessage && (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Error</dt>
              <dd className="text-red-600">{log.errorMessage}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 space-y-3">
          <JsonBlock label="Old value" value={log.oldValue} />
          <JsonBlock label="New value" value={log.newValue} />
          <JsonBlock label="Metadata" value={log.metadata} />
        </div>
      </div>
    </div>
  );
}
