"use client";

import React from "react";
import Link from "next/link";
import { Edit, Eye, MoreVertical, Users, Clock, MapPin, BookOpen, GraduationCap } from "lucide-react";

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

interface BatchCardProps {
  batch: {
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
    subject: { name: string; code: string };
    teacher: { id: string; firstName: string; lastName: string };
    room?: { name: string } | null;
  };
  onDelete?: (id: string) => void;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch }) => {
  const strengthPct = batch.maxStrength > 0
    ? Math.round((batch.currentStrength / batch.maxStrength) * 100)
    : 0;
  const barColor = strengthPct >= 90 ? "bg-red-500" : strengthPct >= 70 ? "bg-yellow-500" : "bg-emerald-500";
  const color = batch.color ?? "#3B82F6";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Color top strip */}
      <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: color }} />

      <div className="flex flex-1 flex-col p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{batch.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{batch.code}</p>
          </div>
          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[batch.status] ?? STATUS_BADGE.INACTIVE}`}>
            {batch.status}
          </span>
        </div>

        {/* Info rows */}
        <div className="space-y-2 text-sm flex-1">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <GraduationCap size={14} className="flex-shrink-0 text-slate-400" />
            <span className="truncate">{batch.teacher.firstName} {batch.teacher.lastName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <BookOpen size={14} className="flex-shrink-0 text-slate-400" />
            <span>{batch.subject.name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Clock size={14} className="flex-shrink-0 text-slate-400" />
            <span>{formatTime(batch.startTime)} – {formatTime(batch.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span className="text-xs text-slate-400 font-medium w-3.5 text-center">📅</span>
            <span className="text-xs">{batch.days.map((d) => DAY_SHORT[d] ?? d).join(", ")}</span>
          </div>
          {batch.room && (
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MapPin size={14} className="flex-shrink-0 text-slate-400" />
              <span>{batch.room.name}</span>
            </div>
          )}
        </div>

        {/* Strength bar */}
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Users size={12} /> Students
            </span>
            <span className={`font-semibold ${strengthPct >= 90 ? "text-red-600" : strengthPct >= 70 ? "text-yellow-600" : "text-slate-700 dark:text-slate-300"}`}>
              {batch.currentStrength}/{batch.maxStrength}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${Math.min(strengthPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Fee */}
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Fee: <span className="font-semibold text-slate-900 dark:text-white">
            {batch.fees > 0 ? `₹${batch.fees.toLocaleString()}/month` : "—"}
          </span>
        </p>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/admin/batches/${batch.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Eye size={14} /> View
          </Link>
          <Link
            href={`/admin/batches/${batch.id}/edit`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BatchCard;
