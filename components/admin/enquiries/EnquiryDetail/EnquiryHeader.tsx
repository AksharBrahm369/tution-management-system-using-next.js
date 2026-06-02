"use client";

import { EnquiryDetailData } from "../types";

interface EnquiryHeaderProps {
  enquiry: EnquiryDetailData;
  onAddFollowUp: () => void;
  onScheduleDemo: () => void;
  onConvert: () => void;
}

function badgeClass(value: string) {
  switch (value) {
    case "NEW":
      return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200";
    case "CONTACTED":
      return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200";
    case "DEMO_SCHEDULED":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    case "DEMO_DONE":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200";
    case "INTERESTED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200";
    case "CONVERTED":
      return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200";
    case "LOST":
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function EnquiryHeader({ enquiry, onAddFollowUp, onScheduleDemo, onConvert }: EnquiryHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">{enquiry.enquiryNumber}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{enquiry.studentName}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{enquiry.studentClass || "Class not set"}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(enquiry.status)}`}>{enquiry.status.replace(/_/g, " ")}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{enquiry.priority}</span>
            {enquiry.isConverted ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">Converted</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onAddFollowUp} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700">Schedule Follow-up</button>
          <button onClick={onScheduleDemo} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Schedule Demo</button>
          {enquiry.status === "INTERESTED" && !enquiry.isConverted ? (
            <button onClick={onConvert} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">Convert to Student</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
