"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { EnquiryListItem } from "../types";

interface EnquiryCardProps {
  enquiry: EnquiryListItem;
  onDragStart: (enquiry: EnquiryListItem) => void;
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

function sourceLabel(source: string) {
  return source.replace(/_/g, " ");
}

export default function EnquiryCard({ enquiry, onDragStart }: EnquiryCardProps) {
  const followUpLabel = enquiry.nextFollowUpAt
    ? formatDistanceToNow(new Date(enquiry.nextFollowUpAt), { addSuffix: true })
    : enquiry.lastFollowUpAt
      ? `Last follow-up ${formatDistanceToNow(new Date(enquiry.lastFollowUpAt), { addSuffix: true })}`
      : "No follow-up yet";

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", enquiry.id);
        onDragStart(enquiry);
      }}
      className="cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{enquiry.studentName}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{enquiry.studentClass || "Class not set"}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeClass(enquiry.status)}`}>{enquiry.status.replace(/_/g, " ")}</span>
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <p>{enquiry.parentPhone}</p>
        <p>{sourceLabel(enquiry.source)}</p>
        <p>{formatDistanceToNow(new Date(enquiry.createdAt), { addSuffix: true })}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{followUpLabel}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/admin/enquiries/${enquiry.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View</Link>
        <Link href={`/admin/enquiries/${enquiry.id}?action=follow-up`} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-cyan-700">Follow Up</Link>
      </div>
    </article>
  );
}
