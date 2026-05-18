"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, AlertTriangle } from "lucide-react";

interface CancelSessionModalProps {
  batchId: string;
  sessionId: string;
  sessionDate: string;
  onClose: () => void;
}

const CancelSessionModal: React.FC<CancelSessionModalProps> = ({
  batchId, sessionId, sessionDate, onClose
}) => {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/batches/${batchId}/sessions/${sessionId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to cancel session");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions", batchId] });
      onClose();
    },
    onError: (err: Error) => alert(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Class</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">Cancel Session</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {new Date(sessionDate).toLocaleDateString("en-IN", { dateStyle: "full" })}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason for cancellation..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => mutation.mutate()}
              disabled={!reason.trim() || mutation.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Cancel Class
            </button>
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
              Keep Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelSessionModal;
