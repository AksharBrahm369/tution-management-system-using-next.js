"use client";

import Link from "next/link";
import { EnquiryListItem } from "../types";

interface EnquiryTableViewProps {
  enquiries: EnquiryListItem[];
  onMoveEnquiry: (enquiryId: string, status: string) => void;
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
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function EnquiryTableView({ enquiries }: EnquiryTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Enquiry No</th>
            <th className="px-4 py-3">Student</th>
            <th className="px-4 py-3">Parent</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assigned To</th>
            <th className="px-4 py-3">Last Follow-up</th>
            <th className="px-4 py-3">Next Follow-up</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => (
            <tr key={enquiry.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{enquiry.enquiryNumber}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                <div className="font-medium text-slate-900 dark:text-white">{enquiry.studentName}</div>
                <div className="text-xs text-slate-500">{enquiry.studentClass || "-"}</div>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                <div>{enquiry.parentName}</div>
                <div className="text-xs text-slate-500">{enquiry.parentPhone}</div>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{enquiry.source.replace(/_/g, " ")}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeClass(enquiry.status)}`}>{enquiry.status.replace(/_/g, " ")}</span>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{enquiry.assignedTo || "Unassigned"}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{enquiry.lastFollowUpAt ? new Date(enquiry.lastFollowUpAt).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{enquiry.nextFollowUpAt ? new Date(enquiry.nextFollowUpAt).toLocaleDateString() : "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/enquiries/${enquiry.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">View</Link>
                  <Link href={`/admin/enquiries/${enquiry.id}?action=follow-up`} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-cyan-700">Follow Up</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
