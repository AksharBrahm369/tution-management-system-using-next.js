"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, MapPin, BookOpen, User, AlertTriangle } from "lucide-react";
import type { BatchCreateInput } from "@/lib/validations/batch";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

interface ConflictResult {
  hasConflict: boolean;
  teacherConflicts: Array<{ batchName: string; conflictingDays: string[] }>;
  roomConflicts: Array<{ batchName: string; roomName: string; conflictingDays: string[] }>;
}

const Step4Review: React.FC = () => {
  const { watch, setValue } = useFormContext<BatchCreateInput>();
  const [conflicts, setConflicts] = useState<ConflictResult | null>(null);
  const [checked, setChecked] = useState(false);

  const data = watch();

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) return { subjects: [] };
      return res.json() as Promise<{ subjects: Array<{ id: string; name: string }> }>;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers-select"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers?limit=100");
      if (!res.ok) return { teachers: [] };
      return res.json() as Promise<{ teachers: Array<{ id: string; firstName: string; lastName: string }> }>;
    },
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) return { rooms: [] };
      return res.json() as Promise<{ rooms: Array<{ id: string; name: string }> }>;
    },
  });

  const subject = subjectsData?.subjects?.find((s) => s.id === data.subjectId);
  const teacher = teachersData?.teachers?.find((t) => t.id === data.teacherId);
  const room = roomsData?.rooms?.find((r) => r.id === data.roomId);

  const generateSessions = watch("generateSessions") ?? true;

  const runConflictCheck = async () => {
    if (!data.teacherId || !data.days?.length || !data.startTime || !data.endTime) return;
    const res = await fetch("/api/admin/conflicts/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: data.teacherId,
        roomId: data.roomId || undefined,
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
      }),
    });
    if (res.ok) {
      const result = await res.json() as ConflictResult;
      setConflicts(result);
      setChecked(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Batch Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 mb-5">
          {data.color && (
            <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
          )}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Name</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.name || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Code</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.code || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Subject</p>
            <p className="font-medium text-slate-900 dark:text-white">{subject?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Academic Year</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.academicYear || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Monthly Fee</p>
            <p className="font-medium text-slate-900 dark:text-white">
              {data.fees ? `₹${data.fees}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Max Strength</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.maxStrength ?? 30}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Start Date</p>
            <p className="font-medium text-slate-900 dark:text-white">
              {data.startDate ? new Date(data.startDate).toLocaleDateString("en-IN") : "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Mode</p>
            <p className="font-medium text-slate-900 dark:text-white">
              {data.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">Schedule</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={16} className="text-slate-400" />
            <div className="flex flex-wrap gap-1.5">
              {(data.days ?? []).map((d) => (
                <span key={d} className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {DAY_LABELS[d] ?? d}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Clock size={16} className="text-slate-400" />
            {data.startTime || "—"} → {data.endTime || "—"}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <User size={16} className="text-slate-400" />
            {teacher ? `${teacher.firstName} ${teacher.lastName}` : "No teacher assigned"}
          </div>
          {room && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <MapPin size={16} className="text-slate-400" />
              {room.name}
            </div>
          )}
        </div>
      </div>

      {/* Students Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Students</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {data.skipEnrollment
            ? "No students will be enrolled now (skipped)"
            : `${(data.studentIds ?? []).length} student(s) will be enrolled`}
        </p>
      </div>

      {/* Session Generation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={generateSessions}
            onChange={(e) => setValue("generateSessions", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Auto-generate class sessions
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System will create individual session records for every scheduled class day from the start date
            </p>
          </div>
        </label>
      </div>

      {/* Final Conflict Check */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Conflict Check</h2>
          <button
            type="button"
            onClick={runConflictCheck}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Run Check
          </button>
        </div>

        {!checked && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click "Run Check" to verify there are no schedule conflicts before creating the batch.
          </p>
        )}

        {checked && conflicts && (
          <div className={`rounded-xl p-4 ${conflicts.hasConflict ? "bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900" : "bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"}`}>
            {conflicts.hasConflict ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">Conflicts Found</p>
                  {conflicts.teacherConflicts.map((c, i) => (
                    <p key={i} className="text-sm text-red-600 dark:text-red-400">
                      Teacher conflict with {c.batchName}
                    </p>
                  ))}
                  {conflicts.roomConflicts.map((c, i) => (
                    <p key={i} className="text-sm text-red-600 dark:text-red-400">
                      Room conflict for {c.roomName}
                    </p>
                  ))}
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Please go back and fix these conflicts before creating the batch.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                ✅ No conflicts detected — ready to create!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step4Review;
