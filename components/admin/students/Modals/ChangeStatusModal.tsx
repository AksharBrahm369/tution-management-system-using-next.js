"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface ChangeStatusModalProps {
  studentId: string;
  currentStatus: string;
  onClose: () => void;
  onUpdated: () => void;
}

const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "ON_LEAVE", "GRADUATED", "TRANSFERRED"];

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ studentId, currentStatus, onClose, onUpdated }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/students/${studentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason, effectiveDate: effectiveDate || undefined }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Student Status</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {statuses.map((item) => (
              <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition-colors ${status === item ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300" : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"}`}>
                <input type="radio" value={item} checked={status === item} onChange={() => setStatus(item)} className="h-4 w-4 text-blue-600" /> {item}
              </label>
            ))}
          </div>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for status change" rows={4} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
            <button onClick={handleUpdate} disabled={loading || !reason} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">{loading ? "Updating..." : "Update Status"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
