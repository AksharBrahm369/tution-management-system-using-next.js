"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";

interface BatchFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  subjects: Array<{ id: string; name: string }>;
  teachers: Array<{ id: string; firstName: string; lastName: string }>;
  subjectId: string;
  onSubjectChange: (v: string) => void;
  teacherId: string;
  onTeacherChange: (v: string) => void;
  selectedDays: string[];
  onDayToggle: (d: string) => void;
  timeRange: string;
  onTimeRangeChange: (v: string) => void;
  onReset: () => void;
}

const DAYS = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
  { label: "Sun", value: "SUNDAY" },
];

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

const BatchFilters: React.FC<BatchFiltersProps> = ({
  search, onSearchChange,
  status, onStatusChange,
  subjects, teachers,
  subjectId, onSubjectChange,
  teacherId, onTeacherChange,
  selectedDays, onDayToggle,
  timeRange, onTimeRangeChange,
  onReset,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
      {/* Row 1: Search + Status + Subject + Teacher */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            aria-label="Search batches"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search batches, subject, teacher..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <select aria-label="Filter batches by status" value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          {["ONGOING", "UPCOMING", "COMPLETED", "INACTIVE", "CANCELLED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select aria-label="Filter batches by subject" value={subjectId} onChange={(e) => onSubjectChange(e.target.value)} className={selectClass}>
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select aria-label="Filter batches by teacher" value={teacherId} onChange={(e) => onTeacherChange(e.target.value)} className={selectClass}>
          <option value="">All Teachers</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Days + Time Range + Reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map(({ label, value }) => {
            const active = selectedDays.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onDayToggle(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select aria-label="Filter batches by time range" value={timeRange} onChange={(e) => onTimeRangeChange(e.target.value)} className={selectClass}>
          <option value="">Any Time</option>
          <option value="morning">Morning (6am–12pm)</option>
          <option value="afternoon">Afternoon (12pm–5pm)</option>
          <option value="evening">Evening (5pm–9pm)</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
};

export default BatchFilters;
