"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  X,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface Subject {
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
}

interface Enrollment {
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
  subject: Subject;
  teacher: Teacher;
  room?: Room | null;
  enrollments: Enrollment[];
  _count: { sessions: number; enrollments: number };
}

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  topic?: string | null;
  description?: string | null;
  cancelReason?: string | null;
  room?: { name: string; code: string } | null;
  roomId?: string | null;
}

interface MonthlyTimetableProps {
  batchId: string;
  batch: BatchDetail;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const MonthlyTimetable: React.FC<MonthlyTimetableProps> = ({ batchId, batch }) => {
  const qc = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Active Modals state
  const [activeModal, setActiveModal] = useState<"add" | "view" | "whatsapp" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Add Session form state
  const [addForm, setAddForm] = useState({
    startTime: batch.startTime,
    endTime: batch.endTime,
    roomId: batch.room?.id || "",
    topic: "",
    description: "",
  });

  // Action Mode (view, reschedule, cancel) within the details modal
  const [detailsMode, setDetailsMode] = useState<"view" | "reschedule" | "cancel">("view");

  // Reschedule form state
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newStartTime: "",
    newEndTime: "",
    newRoomId: "",
    reason: "",
  });

  // Cancel form state
  const [cancelForm, setCancelForm] = useState({
    reason: "",
  });

  // Fetch Rooms list
  const { data: roomsData } = useQuery<{ rooms: Room[] }>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) return { rooms: [] };
      return res.json();
    },
  });

  // Fetch Sessions for selected month
  const { data: sessionsData, isLoading: isSessionsLoading, refetch } = useQuery<{
    sessions: Session[];
  }>({
    queryKey: ["sessions", batchId, month, year],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/batches/${batchId}/sessions?month=${month}&year=${year}`
      );
      if (!res.ok) return { sessions: [] };
      return res.json();
    },
  });

  // Reset Add Form when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setAddForm({
        startTime: batch.startTime,
        endTime: batch.endTime,
        roomId: batch.room?.id || "",
        topic: "",
        description: "",
      });
    }
  }, [selectedDate, batch]);

  // Set default values for reschedule form when session is loaded
  useEffect(() => {
    if (selectedSession) {
      const sDateStr = new Date(selectedSession.date).toISOString().split("T")[0];
      setRescheduleForm({
        newDate: sDateStr,
        newStartTime: selectedSession.startTime,
        newEndTime: selectedSession.endTime,
        newRoomId: selectedSession.roomId || "",
        reason: "",
      });
      setCancelForm({ reason: "" });
      setDetailsMode("view");
    }
  }, [selectedSession]);

  // Mutation to Add Session
  const addSessionMutation = useMutation({
    mutationFn: async (payload: typeof addForm & { date: string }) => {
      const res = await fetch(`/api/admin/batches/${batchId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add timetable entry");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Timetable entry added successfully");
      refetch();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      setActiveModal(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to Delete Session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/admin/batches/${batchId}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete session");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Class session deleted from timetable");
      refetch();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      setActiveModal(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to Reschedule Session
  const rescheduleSessionMutation = useMutation({
    mutationFn: async (payload: typeof rescheduleForm) => {
      const res = await fetch(
        `/api/admin/batches/${batchId}/sessions/${selectedSession?.id}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newDate: new Date(payload.newDate),
            newStartTime: payload.newStartTime,
            newEndTime: payload.newEndTime,
            newRoomId: payload.newRoomId,
            reason: payload.reason,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reschedule session");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Session rescheduled successfully");
      refetch();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      setActiveModal(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to Cancel Session
  const cancelSessionMutation = useMutation({
    mutationFn: async (payload: { reason: string }) => {
      const res = await fetch(
        `/api/admin/batches/${batchId}/sessions/${selectedSession?.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: payload.reason,
            notifyStudents: false,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel session");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Session cancelled successfully");
      refetch();
      qc.invalidateQueries({ queryKey: ["batch", batchId] });
      setActiveModal(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to Send WhatsApp Notification
  const sendWhatsAppMutation = useMutation<
    {
      success: boolean;
      isRealDispatch: boolean;
      recipientCount: number;
      messageText: string;
    },
    Error,
    { dateStr: string }
  >({
    mutationFn: async ({ dateStr }) => {
      const res = await fetch(`/api/admin/batches/${batchId}/timetable/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send WhatsApp messages");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.isRealDispatch) {
        toast.success(`Successfully sent daily schedule to ${data.recipientCount} students on WhatsApp!`);
      } else {
        toast.warning(
          `Demo Mode: WhatsApp messages were only logged to console (Twilio not configured in Settings).`
        );
      }
      setActiveModal(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar calculations
  const getDaysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const daysInCurrentMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const cells: Array<{ day: number; monthOffset: number; date: Date; dateKey: string }> = [];

  const toISODateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Prev month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthVal = month === 1 ? 12 : month - 1;
    const prevYearVal = month === 1 ? year - 1 : year;
    const date = new Date(prevYearVal, prevMonthVal - 1, d);
    cells.push({
      day: d,
      monthOffset: -1,
      date,
      dateKey: toISODateString(date),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const date = new Date(year, month - 1, d);
    cells.push({
      day: d,
      monthOffset: 0,
      date,
      dateKey: toISODateString(date),
    });
  }

  // Next month padding days to round up to 6 rows (42 cells)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthVal = month === 12 ? 1 : month + 1;
    const nextYearVal = month === 12 ? year + 1 : year;
    const date = new Date(nextYearVal, nextMonthVal - 1, d);
    cells.push({
      day: d,
      monthOffset: 1,
      date,
      dateKey: toISODateString(date),
    });
  }

  // Group sessions by Date Key
  const sessionsByDateKey: Record<string, Session[]> = {};
  (sessionsData?.sessions ?? []).forEach((session) => {
    const dKey = toISODateString(new Date(session.date));
    if (!sessionsByDateKey[dKey]) sessionsByDateKey[dKey] = [];
    sessionsByDateKey[dKey].push(session);
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      {/* Calendar Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {MONTHS[month - 1]} {year}
          </h3>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-0.5 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={handleToday}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value) - 1, 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month - 1, 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isSessionsLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center font-semibold text-sm text-slate-500 dark:text-slate-400 py-3">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-200 dark:divide-slate-800">
              {cells.map((cell, idx) => {
                const daySessions = sessionsByDateKey[cell.dateKey] || [];
                const isToday = toISODateString(new Date()) === cell.dateKey;
                const isMuted = cell.monthOffset !== 0;

                return (
                  <div
                    key={idx}
                    className={`group relative min-h-[110px] p-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors ${
                      isToday
                        ? "bg-blue-50/30 dark:bg-blue-950/10"
                        : isMuted
                        ? "bg-slate-50/20 dark:bg-slate-900/10"
                        : "bg-white dark:bg-slate-900/30"
                    }`}
                  >
                    {/* Day Header Row */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center justify-center text-xs font-bold w-6 h-6 rounded-full ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : isMuted
                            ? "text-slate-300 dark:text-slate-700"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {cell.day}
                      </span>

                      {/* Day Action Buttons (appear on hover) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedDate(cell.date);
                            setActiveModal("add");
                          }}
                          title="Add Class Session"
                          className="rounded p-1 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-sm"
                        >
                          <Plus size={12} />
                        </button>
                        {daySessions.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedDate(cell.date);
                              setActiveModal("whatsapp");
                            }}
                            title="Send Schedule on WhatsApp"
                            className="rounded p-1 bg-slate-100 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm"
                          >
                            <MessageSquare size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Day Sessions List */}
                    <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto pr-1">
                      {daySessions.map((session) => {
                        const isCancelled = session.status === "CANCELLED";
                        const isRescheduled = session.status === "RESCHEDULED";
                        return (
                          <button
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session);
                              setActiveModal("view");
                            }}
                            className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border transition-all ${
                              isCancelled
                                ? "bg-red-50 text-red-700 border-red-100 line-through dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                                : isRescheduled
                                ? "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30"
                                : "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            }`}
                          >
                            <div className="font-semibold truncate">
                              {formatTime(session.startTime)}
                            </div>
                            {session.topic && (
                              <div className="truncate font-mono text-[9px] opacity-80">
                                {session.topic}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD TIMETABLE ENTRY ─── */}
      {activeModal === "add" && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Timetable Entry
              </h4>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSessionMutation.mutate({
                  ...addForm,
                  date: selectedDate.toISOString(),
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Date</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-medium">
                  <Calendar size={14} className="text-slate-400" />
                  {selectedDate.toLocaleDateString("en-IN", {
                    dateStyle: "full",
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={addForm.startTime}
                    onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={addForm.endTime}
                    onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Room</label>
                <select
                  value={addForm.roomId}
                  onChange={(e) => setAddForm({ ...addForm, roomId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">{batch.isOnline ? "Online Class" : "Select Room"}</option>
                  {(roomsData?.rooms ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Chemical Bonding Basics"
                  value={addForm.topic}
                  onChange={(e) => setAddForm({ ...addForm, topic: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Additional details..."
                  rows={2}
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSessionMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addSessionMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SESSION DETAIL & EDIT ─── */}
      {activeModal === "view" && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Manage Class Session
              </h4>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            {detailsMode === "view" && (
              <div className="mt-4 space-y-4">
                {/* Details list */}
                <div className="rounded-xl bg-slate-50/50 p-4 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Calendar size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Date</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {new Date(selectedSession.date).toLocaleDateString("en-IN", {
                          dateStyle: "full",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Timing</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {formatTime(selectedSession.startTime)} – {formatTime(selectedSession.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Location / Room</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {selectedSession.room
                          ? `${selectedSession.room.name} (${selectedSession.room.code})`
                          : batch.isOnline
                          ? "Online Class"
                          : "Regular Classroom"}
                      </p>
                    </div>
                  </div>

                  {selectedSession.topic && (
                    <div className="border-t border-slate-100 pt-3 dark:border-slate-850">
                      <p className="text-xs text-slate-400 font-semibold">Topic</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                        {selectedSession.topic}
                      </p>
                    </div>
                  )}

                  {selectedSession.description && (
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Description</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {selectedSession.description}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 dark:border-slate-850 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Status</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        selectedSession.status === "CANCELLED"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : selectedSession.status === "RESCHEDULED"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {selectedSession.status}
                    </span>
                  </div>
                  {selectedSession.status === "CANCELLED" && selectedSession.cancelReason && (
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">Cancellation Reason</span>
                      <p className="text-xs text-red-600 dark:text-red-400 italic">
                        "{selectedSession.cancelReason}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Session Actions Buttons Row */}
                <div className="flex flex-wrap gap-2 justify-between border-t border-slate-100 pt-4 dark:border-slate-800 mt-6">
                  <div className="flex gap-2">
                    {selectedSession.status === "SCHEDULED" && (
                      <>
                        <button
                          onClick={() => setDetailsMode("reschedule")}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setDetailsMode("cancel")}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          Cancel Class
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to completely delete this class session? This action cannot be undone.")) {
                        deleteSessionMutation.mutate(selectedSession.id);
                      }
                    }}
                    disabled={deleteSessionMutation.isPending}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {deleteSessionMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Mode: Reschedule form */}
            {detailsMode === "reschedule" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  rescheduleSessionMutation.mutate(rescheduleForm);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleForm.newDate}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      New Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleForm.newStartTime}
                      onChange={(e) =>
                        setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">
                      New End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleForm.newEndTime}
                      onChange={(e) =>
                        setRescheduleForm({ ...rescheduleForm, newEndTime: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Room</label>
                  <select
                    value={rescheduleForm.newRoomId}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, newRoomId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-955 dark:text-white"
                  >
                    <option value="">{batch.isOnline ? "Online Class" : "Select Room"}</option>
                    {(roomsData?.rooms ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Reason for Rescheduling
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teacher unavailable / Public holiday clash"
                    value={rescheduleForm.reason}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, reason: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-955 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setDetailsMode("view")}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleSessionMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {rescheduleSessionMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Confirm Reschedule
                  </button>
                </div>
              </form>
            )}

            {/* Mode: Cancel form */}
            {detailsMode === "cancel" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  cancelSessionMutation.mutate(cancelForm);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Reason for Cancellation
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a reason that students/parents can see..."
                    value={cancelForm.reason}
                    onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setDetailsMode("view")}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={cancelSessionMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-650 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelSessionMutation.isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    Confirm Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 3: WHATSAPP DAILY TIMETABLE CONFIRMATION ─── */}
      {activeModal === "whatsapp" && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-emerald-600" />
                Send Timetable to WhatsApp
              </h4>
              <button
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You are about to send the daily class schedule for{" "}
                <strong>
                  {selectedDate.toLocaleDateString("en-IN", {
                    dateStyle: "long",
                  })}
                </strong>{" "}
                to all active students enrolled in this batch.
              </p>

              {/* Recipient list preview */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-850 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Batch Enrollments</span>
                  <span>{batch.enrollments.filter((e) => e.student.phone).length} Recipients</span>
                </div>

                <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 space-y-1.5">
                  {batch.enrollments.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between text-xs py-1.5 font-medium"
                    >
                      <span className="text-slate-800 dark:text-slate-200">
                        {e.student.firstName} {e.student.lastName}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {e.student.phone ? e.student.phone : "No Phone Number"}
                      </span>
                    </div>
                  ))}
                  {batch.enrollments.length === 0 && (
                    <p className="text-xs text-slate-500 italic text-center py-4">
                      No students enrolled in this batch.
                    </p>
                  )}
                </div>
              </div>

              {/* Message preview snippet */}
              <div className="rounded-xl bg-slate-50/70 dark:bg-slate-950/40 p-4 border border-dashed border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Message Preview
                </div>
                <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-[150px] overflow-y-auto pr-1">
                  📚 *TuitionPro - Class Schedule*
                  {"\n"}*Batch:* {batch.name} ({batch.subject.name})
                  {"\n"}*Date:*{" "}
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {"\n\n"}Here is your schedule for today:
                  {"\n\n"}
                  {(sessionsByDateKey[toISODateString(selectedDate)] || []).map((s, idx) => (
                    <React.Fragment key={s.id}>
                      {idx + 1}. ⏰ *{formatTime(s.startTime)} - {formatTime(s.endTime)}*{"\n"}
                      {s.topic && `   📖 Topic: ${s.topic}\n`}
                      {`   🏫 Room: ${
                        s.room ? s.room.name : batch.isOnline ? "Online" : "Classroom"
                      }\n\n`}
                    </React.Fragment>
                  ))}
                  Please arrive on time. Have a great learning session! 🚀
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    sendWhatsAppMutation.isPending ||
                    batch.enrollments.filter((e) => e.student.phone).length === 0
                  }
                  onClick={() =>
                    sendWhatsAppMutation.mutate({
                      dateStr: toISODateString(selectedDate),
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sendWhatsAppMutation.isPending && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyTimetable;
