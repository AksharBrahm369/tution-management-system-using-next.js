"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Save, Loader2, Search, X, UserPlus, Users,
  CheckCircle2, AlertCircle, RefreshCw,
} from "lucide-react";
import { batchUpdateSchema, type BatchUpdateInput } from "@/lib/validations/batch";
import Step1BatchDetails from "@/components/admin/batches/CreateBatch/Step1BatchDetails";
import Step2Schedule from "@/components/admin/batches/CreateBatch/Step2Schedule";

interface EditBatchPageProps {
  batchId: string;
}

interface EnrolledStudent {
  id: string;
  enrollDate: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentCode: string;
    phone?: string | null;
  };
}

interface SearchStudentItem {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  status: string;
}

interface BatchMeta {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  description?: string | null;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  days: string[];
  startTime: string;
  endTime: string;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  academicYear: string;
  startDate: string;
  endDate?: string | null;
  isOnline: boolean;
  meetingLink?: string | null;
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const show = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EditBatchPage: React.FC<EditBatchPageProps> = ({ batchId }) => {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast, show: showToast } = useToast();
  const [activeSection, setActiveSection] = useState<"details" | "schedule" | "students">("details");

  // ── Enrollment local state ────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<EnrolledStudent[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);

  // ── Remove state ──────────────────────────────────────────────────────────
  const [removeReason, setRemoveReason] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // ── Add state ─────────────────────────────────────────────────────────────
  const [addingId, setAddingId] = useState<string | null>(null);

  // ─── Fetch enrollments directly ───────────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    setEnrollmentsError(null);
    try {
      const res = await fetch(`/api/admin/batches/${batchId}/students`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json() as { enrollments: EnrolledStudent[] };
      setEnrollments(json.enrollments ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load students";
      setEnrollmentsError(msg);
      console.error("[EditBatchPage] fetchEnrollments error:", e);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, [batchId]);

  // Fetch once on mount + whenever we switch to students tab
  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // ─── Batch meta (for form defaults + maxStrength) ─────────────────────────
  const { data: batchData, isLoading: batchLoading } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches/${batchId}`);
      if (!res.ok) throw new Error("Batch not found");
      return res.json() as Promise<{ batch: BatchMeta }>;
    },
  });

  const maxStrength = batchData?.batch?.maxStrength ?? 30;
  const currentStrength = enrollments.length;

  // ─── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<BatchUpdateInput>({
    resolver: zodResolver(batchUpdateSchema) as never,
    defaultValues: {},
  });

  useEffect(() => {
    if (batchData?.batch) {
      const b = batchData.batch;
      form.reset({
        name: b.name,
        code: b.code,
        description: b.description ?? "",
        color: b.color ?? "",
        subjectId: b.subjectId,
        academicYear: b.academicYear,
        fees: b.fees,
        maxStrength: b.maxStrength,
        startDate: new Date(b.startDate),
        endDate: b.endDate ? new Date(b.endDate) : undefined,
        isOnline: b.isOnline,
        meetingLink: b.meetingLink ?? "",
        days: b.days as BatchUpdateInput["days"],
        startTime: b.startTime,
        endTime: b.endTime,
        teacherId: b.teacherId,
        roomId: b.roomId ?? "",
        scheduleChanged: false,
        generateSessions: false,
      });
    }
  }, [batchData, form]);

  // ─── Save mutation ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: BatchUpdateInput) => {
      const res = await fetch(`/api/admin/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to update batch");
      }
      return res.json();
    },
    onSuccess: () => router.push(`/admin/batches/${batchId}`),
    onError: (err: Error) => showToast(err.message, "error"),
  });

  // ─── Add student ──────────────────────────────────────────────────────────
  const handleAddStudent = async (studentId: string) => {
    if (addingId) return;
    setAddingId(studentId);
    try {
      const res = await fetch(`/api/admin/batches/${batchId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [studentId] }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to enroll student");
      }
      // Immediately refresh the enrollment list
      await fetchEnrollments();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      showToast("Student enrolled successfully!", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to enroll student", "error");
    } finally {
      setAddingId(null);
    }
  };

  // ─── Remove student ───────────────────────────────────────────────────────
  const handleRemoveStudent = async (studentId: string, reason: string) => {
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/admin/batches/${batchId}/students/${studentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to remove student");
      }
      // Immediately refresh the enrollment list
      await fetchEnrollments();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      setRemovingId(null);
      setRemoveReason("");
      showToast("Student removed from batch.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to remove student", "error");
    } finally {
      setRemoveLoading(false);
    }
  };

  if (batchLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  const strengthPct = maxStrength > 0
    ? Math.min(Math.round((currentStrength / maxStrength) * 100), 100)
    : 0;
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student.id));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl text-white text-sm font-semibold animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-600"
              : "bg-red-600"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircle2 size={17} className="shrink-0" />
            : <AlertCircle size={17} className="shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href={`/admin/batches/${batchId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Batch
          </Link>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Edit Batch</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{batchData?.batch?.name}</p>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 w-fit">
        {(["details", "schedule", "students"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveSection(s)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              activeSection === s
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {s === "details" ? "Batch Details" : s === "schedule" ? "Schedule & Teacher" : "Students"}
          </button>
        ))}
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-5"
        >
          {/* ── Details Tab ── */}
          {activeSection === "details" && (
            <Step1BatchDetails generatedCode={batchData?.batch?.code ?? ""} />
          )}

          {/* ── Schedule Tab ── */}
          {activeSection === "schedule" && (
            <>
              <Step2Schedule editBatchId={batchId} />
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("scheduleChanged")}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Apply schedule changes</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Check this if you changed days, times, teacher, or room. This will re-run conflict detection.
                    </p>
                  </div>
                </label>
                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("generateSessions")}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Regenerate future sessions</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Cancels all future SCHEDULED sessions and regenerates based on new schedule.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          {/* ── Students Tab ── */}
          {activeSection === "students" && (
            <div className="space-y-5">
              {/* Capacity bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Batch Capacity</span>
                  <span
                    className={`font-bold ${
                      strengthPct >= 100
                        ? "text-red-500"
                        : strengthPct >= 80
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {currentStrength} / {maxStrength} students
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      strengthPct >= 100
                        ? "bg-red-500"
                        : strengthPct >= 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                {strengthPct >= 100 && (
                  <p className="mt-2 text-xs text-red-500 font-medium">
                    Batch is full. Remove a student to add new ones.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ── Enrolled Students ── */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Users size={17} className="text-blue-500" />
                      Enrolled Students
                      <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5">
                        {currentStrength}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={fetchEnrollments}
                      disabled={enrollmentsLoading}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition disabled:opacity-40"
                      title="Refresh"
                    >
                      <RefreshCw size={14} className={enrollmentsLoading ? "animate-spin" : ""} />
                    </button>
                  </div>

                  {enrollmentsError ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-red-500">
                      <AlertCircle size={24} />
                      <p className="text-xs font-medium">{enrollmentsError}</p>
                      <button
                        type="button"
                        onClick={fetchEnrollments}
                        className="text-xs underline text-blue-500 hover:text-blue-700"
                      >
                        Try again
                      </button>
                    </div>
                  ) : enrollmentsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                      <Loader2 className="animate-spin text-blue-500" size={22} />
                      <p className="text-xs">Loading students...</p>
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                      <Users size={36} className="mb-2 stroke-1" />
                      <p className="text-sm font-medium">No students enrolled yet</p>
                      <p className="text-xs mt-1">Use the panel on the right to add students.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/30 group hover:border-slate-200 dark:hover:border-slate-700 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white uppercase">
                              {enrollment.student.firstName?.[0] ?? "?"}{enrollment.student.lastName?.[0] ?? ""}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{enrollment.student.studentCode}</p>
                            </div>
                          </div>

                          {removingId === enrollment.student.id ? (
                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                              <input
                                type="text"
                                value={removeReason}
                                onChange={(e) => setRemoveReason(e.target.value)}
                                placeholder="Reason (min 3 chars)"
                                autoFocus
                                className="text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white px-2 py-1.5 w-32 focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400"
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") { setRemovingId(null); setRemoveReason(""); }
                                  if (e.key === "Enter" && removeReason.trim().length >= 3) {
                                    handleRemoveStudent(enrollment.student.id, removeReason.trim());
                                  }
                                }}
                              />
                              <button
                                type="button"
                                disabled={removeReason.trim().length < 3 || removeLoading}
                                onClick={() => handleRemoveStudent(enrollment.student.id, removeReason.trim())}
                                className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white px-2 py-1.5 text-xs font-semibold transition"
                              >
                                {removeLoading
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : "OK"}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRemovingId(null); setRemoveReason(""); }}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setRemovingId(enrollment.student.id); setRemoveReason(""); }}
                              className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition ml-2 flex-shrink-0"
                              title="Remove student"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Add Students Search ── */}
                <StudentSearch
                  enrolledIds={enrolledStudentIds}
                  currentStrength={currentStrength}
                  maxStrength={maxStrength}
                  addingId={addingId}
                  onAdd={handleAddStudent}
                />
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {activeSection === "students" ? (
              <Link
                href={`/admin/batches/${batchId}`}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Done
              </Link>
            ) : (
              <>
                <Link
                  href={`/admin/batches/${batchId}`}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition"
                >
                  {saveMutation.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Save size={16} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

// ─── Student Search Sub-Component ─────────────────────────────────────────────

interface StudentSearchProps {
  enrolledIds: Set<string>;
  currentStrength: number;
  maxStrength: number;
  addingId: string | null;
  onAdd: (studentId: string) => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({
  enrolledIds,
  currentStrength,
  maxStrength,
  addingId,
  onAdd,
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [students, setStudents] = useState<SearchStudentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "30", sortBy: "firstName", sortOrder: "asc" });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/admin/students?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setStudents(
            (json.students ?? []).map((s: SearchStudentItem) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              studentCode: s.studentCode,
              status: s.status,
            }))
          );
        }
      } catch {
        // silently fail — user can retry by modifying search
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStudents();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const isFull = currentStrength >= maxStrength;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <UserPlus size={17} className="text-blue-500" />
        Add Students
      </h3>

      {isFull && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400 font-medium">
          Batch is full ({maxStrength}/{maxStrength}). Remove a student first.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, code..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="max-h-[340px] overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={20} />
            <p className="text-xs">Loading directory...</p>
          </div>
        ) : students.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            {debouncedSearch ? "No students match your search." : "No students found."}
          </p>
        ) : (
          students.map((student) => {
            const isEnrolled = enrolledIds.has(student.id);
            const isBeingAdded = addingId === student.id;
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                  isEnrolled
                    ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${
                      isEnrolled
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {student.firstName?.[0] ?? "?"}{student.lastName?.[0] ?? ""}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{student.studentCode}</p>
                  </div>
                </div>
                <div className="ml-2 shrink-0">
                  {isEnrolled ? (
                    <span className="flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-xs font-semibold">
                      <CheckCircle2 size={11} /> Enrolled
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isFull || isBeingAdded || addingId !== null}
                      onClick={() => onAdd(student.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-1.5 text-xs font-semibold transition-all"
                    >
                      {isBeingAdded ? (
                        <><Loader2 size={12} className="animate-spin" /> Adding...</>
                      ) : (
                        <><UserPlus size={12} /> Add</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EditBatchPage;
