"use client";

import { format } from "date-fns";
import { EnquiryFollowUp } from "../types";

interface FollowUpTimelineProps {
  followUps: EnquiryFollowUp[];
  onAddFollowUp: () => void;
}

function badgeClass(value: string) {
  switch (value) {
    case "PENDING":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "MISSED":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function FollowUpTimeline({ followUps, onAddFollowUp }: FollowUpTimelineProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Follow-up Timeline</h3>
        <button onClick={onAddFollowUp} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Add Follow-up</button>
      </div>

      <div className="space-y-3">
        {followUps.length > 0 ? (
          followUps.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-slate-900 dark:text-white">{format(new Date(item.scheduledAt), "PP p")}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.type}</span>
                <span className={`rounded-full px-3 py-1 text-xs ${badgeClass(item.status)}`}>{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.notes || "No notes provided."}</p>
              <div className="mt-2 grid gap-2 text-sm text-slate-500 dark:text-slate-400 md:grid-cols-2">
                <div>Outcome: {item.outcome || "-"}</div>
                <div>Done by: {item.doneBy || "-"}</div>
                <div>Completed: {item.completedAt ? format(new Date(item.completedAt), "PP p") : "-"}</div>
                <div>Next follow-up: {item.nextFollowUpAt ? format(new Date(item.nextFollowUpAt), "PP p") : "-"}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No follow-ups yet.</div>
        )}
      </div>
    </div>
  );
}
