"use client";

import Link from "next/link";
import { EnquiryListItem } from "../types";
import EnquiryCard from "./EnquiryCard";

interface KanbanColumnProps {
  title: string;
  status: string;
  enquiries: EnquiryListItem[];
  count: number;
  onDropEnquiry: (enquiryId: string, status: string) => void;
  onDragStart: (enquiry: EnquiryListItem) => void;
}

export default function KanbanColumn({ title, status, enquiries, count, onDropEnquiry, onDragStart }: KanbanColumnProps) {
  return (
    <section
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const enquiryId = event.dataTransfer.getData("text/plain");
        if (enquiryId) {
          onDropEnquiry(enquiryId, status);
        }
      }}
      className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{count}</span>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {enquiries.length > 0 ? (
          enquiries.map((enquiry) => (
            <EnquiryCard key={enquiry.id} enquiry={enquiry} onDragStart={onDragStart} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40">
            No enquiries in this stage.
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link href="/admin/enquiries/add" className="block rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-3 text-center text-sm font-medium text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
          Add enquiry
        </Link>
      </div>
    </section>
  );
}
