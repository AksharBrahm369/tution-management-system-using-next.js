"use client";

import React from "react";
import Link from "next/link";
import { Eye, Edit } from "lucide-react";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

const STATUS_BADGE: Record<string, string> = {
  ONGOING: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  UPCOMING: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  COMPLETED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  status: string;
  days: string[];
  startTime: string;
  endTime: string;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  subject: { name: string };
  teacher: { firstName: string; lastName: string };
  room?: { name: string } | null;
}

const BatchTableView: React.FC<{ batches: Batch[]; basePath?: string }> = ({ batches, basePath = "/admin/batches" }) => {
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">No batches found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
            {["Batch", "Subject", "Teacher", "Schedule", "Room", "Strength", "Fee", "Status", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {batches.map((batch) => {
            const pct = batch.maxStrength > 0
              ? Math.round((batch.currentStrength / batch.maxStrength) * 100) : 0;
            const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-emerald-500";

            return (
              <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {batch.color && (
                      <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: batch.color }} />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{batch.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{batch.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{batch.subject.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {batch.teacher.firstName} {batch.teacher.lastName}
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-600 dark:text-slate-400">
                    {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {batch.days.map((d) => DAY_SHORT[d] ?? d).join(", ")}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {batch.room?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {batch.currentStrength}/{batch.maxStrength}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {batch.fees > 0 ? `₹${batch.fees.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[batch.status] ?? STATUS_BADGE.INACTIVE}`}>
                    {batch.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`${basePath}/${batch.id}`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Eye size={15} />
                    </Link>
                    <Link
                      href={`${basePath}/${batch.id}/edit`}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BatchTableView;
