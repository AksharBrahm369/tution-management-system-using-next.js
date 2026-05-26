"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface BatchOption {
  id: string;
  name: string;
  code: string;
}

interface ScheduleDemoModalProps {
  open: boolean;
  enquiryId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScheduleDemoModal({ open, enquiryId, onClose, onSaved }: ScheduleDemoModalProps) {
  const [batchId, setBatchId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [parentFeedback, setParentFeedback] = useState("");
  const [interested, setInterested] = useState("true");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data } = useQuery<{ batches: BatchOption[] }>({
    queryKey: ["enquiry-demo-batches"],
    queryFn: async () => {
      const response = await fetch("/api/admin/batches?limit=100&status=ACTIVE", { credentials: "same-origin" });
      if (!response.ok) {
        return { batches: [] };
      }
      return response.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && !batchId && data?.batches?.length) {
      setBatchId(data.batches[0].id);
    }
  }, [open, batchId, data?.batches]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const today = new Date();
    const dateValue = today.toISOString().slice(0, 10);
    const roundedMinutes = Math.ceil(today.getMinutes() / 30) * 30;
    const timeDate = new Date(today);
    if (roundedMinutes === 60) {
      timeDate.setHours(today.getHours() + 1, 0, 0, 0);
    } else {
      timeDate.setHours(today.getHours(), roundedMinutes, 0, 0);
    }

    if (!scheduledDate) {
      setScheduledDate(dateValue);
    }

    if (!scheduledTime) {
      setScheduledTime(timeDate.toTimeString().slice(0, 5));
    }
  }, [open, scheduledDate, scheduledTime]);

  if (!open) return null;

  const submit = async () => {
    setFormError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          batchId,
          scheduledDate,
          scheduledTime,
          teacherNotes,
          parentFeedback,
          interested: interested === "true",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload.issues) {
          setFieldErrors(payload.issues.fieldErrors ?? {});
          const firstField = Object.values(payload.issues.fieldErrors ?? {}).flat().find(Boolean);
          throw new Error(firstField || payload.error || "Failed to schedule demo");
        }

        throw new Error(payload.error || "Failed to schedule demo");
      }

      onSaved();
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to schedule demo");
      alert(error instanceof Error ? error.message : "Failed to schedule demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Schedule Demo</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create a demo class for this enquiry.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">Close</button>
        </div>

        {formError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
            {formError}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white md:col-span-2">
            {!(data?.batches?.length) ? <option value="">No active batches available</option> : null}
            {(data?.batches ?? []).map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name} ({batch.code})</option>
            ))}
          </select>
          <input value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} type="date" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
          {fieldErrors.scheduledDate?.length ? <p className="-mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.scheduledDate[0]}</p> : null}
          <input value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} type="time" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
          {fieldErrors.scheduledTime?.length ? <p className="-mt-2 text-xs text-rose-600 dark:text-rose-400">{fieldErrors.scheduledTime[0]}</p> : null}
          <select value={interested} onChange={(event) => setInterested(event.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
            <option value="true">Interested</option>
            <option value="false">Not interested</option>
          </select>
          <textarea value={teacherNotes} onChange={(event) => setTeacherNotes(event.target.value)} placeholder="Teacher notes" className="min-h-24 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
          <textarea value={parentFeedback} onChange={(event) => setParentFeedback(event.target.value)} placeholder="Parent feedback" className="min-h-24 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{loading ? "Saving..." : "Save Demo"}</button>
        </div>
      </div>
    </div>
  );
}
