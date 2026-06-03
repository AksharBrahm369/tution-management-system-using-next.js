"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Edit, Users, BookOpen, GraduationCap, MapPin,
  Clock, Calendar, CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  X, Loader2, UserPlus
} from "lucide-react";
import CancelSessionModal from "../Modals/CancelSessionModal";
import MonthlyTimetable from "./MonthlyTimetable";

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};


const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  UPCOMING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

const SESSION_BADGE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-yellow-100 text-yellow-700",
  ONGOING: "bg-purple-100 text-purple-700",
};

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

interface BatchDetailPageProps {
  batchId: string;
}

const BatchDetailPage: React.FC<BatchDetailPageProps> = ({ batchId }) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "students" | "timetable">("overview");
  const [cancelSession, setCancelSession] = useState<{ id: string; date: string } | null>(null);
  const [sessionMonth, setSessionMonth] = useState(new Date().getMonth() + 1);
  const [sessionYear, setSessionYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches/${batchId}`);
      if (!res.ok) throw new Error("Failed to load batch");
      return res.json() as Promise<{ batch: BatchDetail }>;
    },
  });

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", batchId, sessionMonth, sessionYear],
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches/${batchId}/sessions?month=${sessionMonth}&year=${sessionYear}`);
      if (!res.ok) return { sessions: [] };
      return res.json() as Promise<{ sessions: Session[] }>;
    },
    enabled: activeTab === "sessions",
  });

  const removeStudent = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string; reason: string }) => {
      const res = await fetch(`/api/admin/batches/${batchId}/students/${studentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to remove student");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!data?.batch) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-slate-500">Batch not found</p>
      </div>
    );
  }

  const batch = data.batch;
  const strengthPct = batch.maxStrength > 0
    ? Math.round((batch.currentStrength / batch.maxStrength) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
        {batch.color && <div className="h-2 w-full" style={{ backgroundColor: batch.color }} />}
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin/batches" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft size={16} /> Back to Batches
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{batch.name}</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[batch.status] ?? STATUS_BADGE.INACTIVE}`}>
                {batch.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-400">{batch.code}</p>
          </div>
          <Link href={`/admin/batches/${batchId}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Edit size={16} /> Edit Batch
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 p-6 dark:border-slate-800 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Subject</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">{batch.subject.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Teacher</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
              {batch.teacher.firstName} {batch.teacher.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Schedule</p>
            <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
              {formatTime(batch.startTime)} – {formatTime(batch.endTime)}
            </p>
            <p className="text-xs text-slate-400">{batch.days.map((d) => DAY_SHORT[d] ?? d).join(", ")}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Strength</p>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="font-semibold text-slate-900 dark:text-white">{batch.currentStrength}/{batch.maxStrength}</p>
            </div>
            <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${strengthPct >= 90 ? "bg-red-500" : strengthPct >= 70 ? "bg-yellow-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(strengthPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 w-fit">
        {(["overview", "sessions", "students", "timetable"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            {tab === "timetable" ? "Monthly Timetable" : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Batch Details</h3>
            <dl className="space-y-3 text-sm">
              {batch.description && (
                <div>
                  <dt className="text-slate-400">Description</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{batch.description}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-400">Academic Year</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{batch.academicYear}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Start Date</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {new Date(batch.startDate).toLocaleDateString("en-IN", { dateStyle: "long" })}
                </dd>
              </div>
              {batch.endDate && (
                <div>
                  <dt className="text-slate-400">End Date</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">
                    {new Date(batch.endDate).toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-400">Monthly Fee</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {batch.fees > 0 ? `₹${batch.fees.toLocaleString()}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Mode</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {batch.isOnline ? "🌐 Online" : "🏫 Offline"}
                </dd>
              </div>
              {batch.room && (
                <div>
                  <dt className="text-slate-400">Room</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{batch.room.name}</dd>
                </div>
              )}
              {batch.isOnline && batch.meetingLink && (
                <div>
                  <dt className="text-slate-400">Meeting Link</dt>
                  <dd><a href={batch.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{batch.meetingLink}</a></dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Session Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{batch._count.sessions}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Sessions</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{batch.completedSessions ?? 0}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Completed</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{batch.cancelledSessions ?? 0}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Cancelled</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{batch.currentStrength}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Enrolled Students</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={sessionMonth}
              onChange={(e) => setSessionMonth(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={sessionYear}
              onChange={(e) => setSessionYear(parseInt(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="space-y-3">
            {(sessionsData?.sessions ?? []).map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {new Date(session.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SESSION_BADGE[session.status] ?? SESSION_BADGE.SCHEDULED}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatTime(session.startTime)} – {formatTime(session.endTime)}
                    {session.room && ` · ${session.room.name}`}
                  </p>
                  {session.topic && <p className="text-xs text-slate-400 mt-0.5">Topic: {session.topic}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {session.status === "SCHEDULED" && (
                    <button
                      onClick={() => setCancelSession({ id: session.id, date: session.date })}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  )}
                  {session.status === "CANCELLED" && session.cancelReason && (
                    <p className="text-xs text-slate-400">{session.cancelReason}</p>
                  )}
                </div>
              </div>
            ))}
            {(sessionsData?.sessions ?? []).length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-900/30">
                <p className="text-slate-500">No sessions found for this period</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {batch.currentStrength}/{batch.maxStrength} seats filled
            </p>
            <Link
              href={`/admin/batches/${batchId}/enroll`}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <UserPlus size={15} /> Enroll Students
            </Link>
          </div>

          <div className="space-y-3">
            {batch.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {enrollment.student.firstName[0]}{enrollment.student.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {enrollment.student.firstName} {enrollment.student.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{enrollment.student.studentCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-400">
                    Since {new Date(enrollment.enrollDate).toLocaleDateString("en-IN")}
                  </p>
                  <button
                    onClick={() => {
                      const reason = prompt("Reason for removing student:");
                      if (reason) removeStudent.mutate({ studentId: enrollment.student.id, reason });
                    }}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {batch.enrollments.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 dark:border-slate-700 dark:bg-slate-900/30">
                <p className="text-slate-500">No students enrolled yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === "timetable" && (
        <MonthlyTimetable batchId={batchId} batch={batch as any} />
      )}

      {/* Cancel Session Modal */}
      {cancelSession && (
        <CancelSessionModal
          batchId={batchId}
          sessionId={cancelSession.id}
          sessionDate={cancelSession.date}
          onClose={() => setCancelSession(null)}
        />
      )}
    </div>
  );
};

export default BatchDetailPage;

// ─── Types ───────────────────────────────────────────────────────────────────

interface BatchDetail {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  status: string;
  description?: string | null;
  days: string[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  academicYear: string;
  startDate: string;
  endDate?: string | null;
  isOnline: boolean;
  meetingLink?: string | null;
  subject: { name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
  room?: { id: string; name: string; code: string } | null;
  enrollments: Array<{
    id: string;
    enrollDate: string;
    student: { id: string; firstName: string; lastName: string; studentCode: string };
  }>;
  _count: { sessions: number; enrollments: number };
  completedSessions?: number;
  cancelledSessions?: number;
}

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  topic?: string | null;
  cancelReason?: string | null;
  room?: { name: string } | null;
}
