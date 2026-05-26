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
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Workflow</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">Follow-up Timeline</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every call, visit, and next step in one place.</p>
        </div>
        <button
          onClick={onAddFollowUp}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 hover:shadow-md"
        >
          Add Follow-up
        </button>
      </div>

      <div className="space-y-4">
        {followUps.length > 0 ? (
          followUps.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-950/70 dark:to-slate-900/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{format(new Date(item.scheduledAt), "PPP")}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{format(new Date(item.scheduledAt), "p")}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-700">{item.type}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(item.status)}`}>{item.status}</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{item.notes || "No notes provided."}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <InfoRow label="Outcome" value={item.outcome || "-"} />
                <InfoRow label="Done by" value={item.doneByName || "-"} />
                <InfoRow label="Done by ID" value={item.doneBy || "-"} mono />
                <InfoRow label="Completed" value={item.completedAt ? format(new Date(item.completedAt), "PP p") : "-"} />
                <InfoRow label="Next follow-up" value={item.nextFollowUpAt ? format(new Date(item.nextFollowUpAt), "PP p") : "-"} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/30">
            No follow-ups yet.
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-medium text-slate-800 dark:text-slate-200 ${mono ? "font-mono text-xs break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}
