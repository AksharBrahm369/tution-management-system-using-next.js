"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-5 animate-pulse">
        {/* Welcome Banner Skeleton */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>

        {/* 2-column Content Skeleton */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left card skeleton */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-32 rounded bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-20 rounded bg-slate-100 dark:bg-slate-800/40" />
              <div className="h-20 rounded bg-slate-100 dark:bg-slate-800/40" />
            </div>
          </div>

          {/* Right card skeleton */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-32 rounded bg-slate-300 dark:bg-slate-700" />
            </div>
            <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800/40" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-2 text-sm">{error || "Failed to load dashboard."}</p>
      </div>
    );
  }

  const { student, summary } = data;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Welcome, {student.firstName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {student.studentCode} | Year {student.academicYear}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-300">
            <BookOpen size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Current Batch</h2>
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            {student.batchEnrollments.length > 0 ? (
              student.batchEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
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
                      className="mt-1 inline-block text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      Join class: {enrollment.batch.meetingLink}
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Not enrolled in any batch.
              </div>
            )}
          </div>
        </div>

        <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Clock size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Attendance</h2>
          </div>
          <div className="mt-4 flex h-[calc(100%-2rem)] min-h-[140px] flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-3xl font-semibold text-slate-950 dark:text-white">
              {summary.attendancePercent ?? 0}%
            </div>
            <p className="mt-1 text-sm text-slate-500">Overall Attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
