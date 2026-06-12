"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock3, MessageSquareText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DueFollowUp {
  id: string;
  enquiryId: string;
  enquiryNumber: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  status: string;
  priority: string;
  source: string;
  assignedTo: string | null;
  type: string;
  scheduledAt: string;
  notes: string | null;
  outcome: string | null;
}

export default function FollowUpReminderWidget() {
  const { data, isLoading, isError } = useQuery<{ followUps: DueFollowUp[] }>({
    queryKey: ["enquiry-follow-ups-due"],
    queryFn: async () => {
      const response = await fetch("/api/admin/enquiries/follow-ups/due?limit=5", { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Failed to load due follow-ups");
      }
      return response.json();
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Follow-up Reminders</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enquiries that need attention today.</p>
        </div>
        <Clock3 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            Could not load follow-up reminders.
          </div>
        ) : (data?.followUps.length ?? 0) > 0 ? (
          data?.followUps.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{item.studentName}</div>
                  <div className="text-xs text-slate-500">{item.enquiryNumber} · {item.parentName}</div>
                </div>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50">{formatDistanceToNow(new Date(item.scheduledAt), { addSuffix: true })}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.type} · {item.priority}</div>
              <div className="mt-3 flex items-center gap-2">
                <Link href={`/admin/enquiries/${item.enquiryId}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Open</Link>
                <Link href={`/admin/enquiries/${item.enquiryId}?action=follow-up`} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"><MessageSquareText size={14} /> Follow Up</Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No follow-ups due right now.</div>
        )}
      </div>
    </div>
  );
}
