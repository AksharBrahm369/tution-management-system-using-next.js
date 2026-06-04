"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock } from "lucide-react";

type StudentDashboardData = {
  student: {
    firstName: string;
    studentCode: string;
    academicYear: string;
    batchEnrollments: Array<{
      id: string;
      batch: {
        name: string;
        startTime?: string | null;
        endTime?: string | null;
        isOnline: boolean;
        meetingLink?: string | null;
        room?: {
          id: string;
          name: string;
          code: string;
        } | null;
      };
    }>;
  };
  summary: {
    attendancePercent: number | null;
  };
};

function formatTimeTo12Hour(value?: string | null) {
  if (!value) return "Schedule not set";

  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getBatchModeLabel(batch: StudentDashboardData["student"]["batchEnrollments"][number]["batch"]) {
  if (batch.isOnline) {
    return "Online";
  }

  if (batch.room?.name) {
    return `Offline - ${batch.room.name}`;
  }

  return "Offline";
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/me", { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(payload.message || "Failed to fetch student data");
        }

        setData(payload);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch student data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8 text-slate-500">Loading your dashboard...</div>;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-2 text-sm">{error || "Failed to load dashboard."}</p>
      </div>
    );
  }

  const { student, summary } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {student.firstName}!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {student.studentCode} | Year {student.academicYear}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <BookOpen size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Current Batch</h2>
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            {student.batchEnrollments.length > 0 ? (
              student.batchEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{enrollment.batch.name}</div>
                  <div className="mt-1 text-xs">
                    {enrollment.batch.startTime && enrollment.batch.endTime
                      ? `${formatTimeTo12Hour(enrollment.batch.startTime)} - ${formatTimeTo12Hour(enrollment.batch.endTime)}`
                      : "Schedule not set"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {getBatchModeLabel(enrollment.batch)}
                  </div>
                  {enrollment.batch.isOnline && enrollment.batch.meetingLink ? (
                    <a
                      href={enrollment.batch.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                      Join class: {enrollment.batch.meetingLink}
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Not enrolled in any batch.
              </div>
            )}
          </div>
        </div>

        <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Clock size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Attendance</h2>
          </div>
          <div className="mt-4 flex h-[calc(100%-2rem)] min-h-[140px] flex-col justify-center rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary.attendancePercent ?? 0}%
            </div>
            <p className="mt-1 text-sm text-slate-500">Overall Attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
