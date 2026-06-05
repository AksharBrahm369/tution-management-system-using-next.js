"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Users, MapPin, User } from "lucide-react";
import type { BatchCreateInput } from "@/lib/validations/batch";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const Step4Review: React.FC = () => {
  const { watch, setValue } = useFormContext<BatchCreateInput>();
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-5 flex items-center gap-3">
          {data.color && <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: data.color }} />}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Name</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.name || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Code</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.code || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Subject</p>
            <p className="font-medium text-slate-900 dark:text-white">{subject?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Academic Year</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.academicYear || "-"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Monthly Fee</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.fees ? `Rs ${data.fees}` : "-"}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Max Strength</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.maxStrength ?? 30}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Start Date</p>
            <p className="font-medium text-slate-900 dark:text-white">
              {data.startDate ? new Date(data.startDate).toLocaleDateString("en-IN") : "-"}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Mode</p>
            <p className="font-medium text-slate-900 dark:text-white">{data.isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">Schedule</h2>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
            {data.startTime || "-"} to {data.endTime || "-"}
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Students</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {data.skipEnrollment ? "No students will be enrolled now (skipped)" : `${(data.studentIds ?? []).length} student(s) will be enrolled`}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={generateSessions}
            onChange={(e) => setValue("generateSessions", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
          />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Auto-generate class sessions</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              System will create individual session records for every scheduled class day from the start date
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default Step4Review;
