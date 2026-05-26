"use client";

import { useState } from "react";
import { followUpTypeSchema } from "@/lib/validations/enquiry";

interface AddFollowUpModalProps {
  open: boolean;
  enquiryId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddFollowUpModal({ open, enquiryId, onClose, onSaved }: AddFollowUpModalProps) {
  const [type, setType] = useState("CALL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type,
          scheduledAt,
          notes,
          outcome,
          nextFollowUpAt: nextFollowUpAt || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to add follow-up");
      }

      onSaved();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Add Follow-up</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Record the next call, WhatsApp, email, or visit.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
            {followUpTypeSchema.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <input value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} type="datetime-local" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" className="min-h-28 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm md:col-span-2 dark:border-slate-700 dark:text-white" />
          <textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="Outcome" className="min-h-24 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm md:col-span-2 dark:border-slate-700 dark:text-white" />
          <input value={nextFollowUpAt} onChange={(event) => setNextFollowUpAt(event.target.value)} type="datetime-local" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm md:col-span-2 dark:border-slate-700 dark:text-white" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{loading ? "Saving..." : "Save Follow-up"}</button>
        </div>
      </div>
    </div>
  );
}
