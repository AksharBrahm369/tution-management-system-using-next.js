"use client";

import React from "react";
import Link from "next/link";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm
const DAYS_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

interface Batch {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  days: string[];
  startTime: string;
  endTime: string;
  teacher: { firstName: string; lastName: string };
  room?: { name: string } | null;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const BatchTimetableView: React.FC<{ batches: Batch[] }> = ({ batches }) => {
  const activeDays = DAYS_ORDER;

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">
          No batch schedule to display
        </p>
      </div>
    );
  }

  const renderBatchesForCell = (day: string, hour: number) => {
    const cellStart = hour * 60;
    const cellEnd = cellStart + 60;

    return batches
      .filter((b) => {
        if (!b.days.includes(day)) return false;
        const start = toMinutes(b.startTime);
        const end = toMinutes(b.endTime);
        return start < cellEnd && end > cellStart;
      })
      .map((b) => (
        <Link
          key={b.id}
          href={`/admin/batches/${b.id}`}
          className="block rounded-lg px-2 py-1.5 text-xs text-white transition-opacity hover:opacity-90 mb-1"
          style={{ backgroundColor: b.color ?? "#3B82F6" }}
        >
          <p className="font-semibold truncate">{b.name}</p>
          <p className="opacity-80 truncate">
            {b.teacher.firstName} {b.teacher.lastName}
          </p>
          {b.room && <p className="opacity-80 truncate">{b.room.name}</p>}
        </Link>
      ));
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-[700px]">
        {/* Header */}
        <div
          className="grid border-b border-slate-200 dark:border-slate-800"
          style={{ gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)` }}
        >
          <div className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Time</div>
          {activeDays.map((day) => (
            <div key={day} className="p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide dark:text-slate-400">
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        {/* Rows */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid border-b border-slate-100 dark:border-slate-800/50"
            style={{ gridTemplateColumns: `80px repeat(${activeDays.length}, 1fr)` }}
          >
            <div className="p-2 text-xs text-slate-400 border-r border-slate-100 dark:border-slate-800">
              {hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`}
            </div>
            {activeDays.map((day) => {
              const batchBlocks = renderBatchesForCell(day, hour);
              return (
                <div
                  key={day}
                  className="min-h-[52px] p-1 border-r border-slate-100 last:border-r-0 dark:border-slate-800"
                >
                  {batchBlocks}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchTimetableView;
