"use client";

import { format } from "date-fns";
import { EnquiryDemoClass } from "../types";

interface DemoClassesTabProps {
  demoClasses: EnquiryDemoClass[];
  onScheduleDemo: () => void;
}

function statusClass(value: string) {
  switch (value) {
    case "SCHEDULED":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200";
    case "NO_SHOW":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function DemoClassesTab({ demoClasses, onScheduleDemo }: DemoClassesTabProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Demo Classes</h3>
        <button onClick={onScheduleDemo} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Schedule Demo</button>
      </div>

      <div className="space-y-3">
        {demoClasses.length > 0 ? (
          demoClasses.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-slate-900 dark:text-white">{format(new Date(item.scheduledDate), "PP")}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.scheduledTime}</span>
                <span className={`rounded-full px-3 py-1 text-xs ${statusClass(item.status)}`}>{item.status}</span>
              </div>
              <div className="mt-2 grid gap-2 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                <div>Batch: {item.batchName || item.batchId || "-"}</div>
                <div>Interested: {item.interested === null ? "-" : item.interested ? "Yes" : "No"}</div>
                <div>Teacher notes: {item.teacherNotes || "-"}</div>
                <div>Parent feedback: {item.parentFeedback || "-"}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No demo classes scheduled yet.</div>
        )}
      </div>
    </div>
  );
}
