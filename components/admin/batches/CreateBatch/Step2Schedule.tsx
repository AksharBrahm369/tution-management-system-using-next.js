"use client";

import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import type { BatchCreateInput } from "@/lib/validations/batch";

const DAYS = [
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
  { label: "Sun", value: "SUNDAY" },
] as const;

interface ConflictResult {
  hasConflict: boolean;
  teacherConflicts: Array<{ batchName: string; conflictingDays: string[] }>;
  roomConflicts: Array<{ batchName: string; roomName: string; conflictingDays: string[] }>;
}

interface Step2Props {
  editBatchId?: string;
}

const Step2Schedule: React.FC<Step2Props> = ({ editBatchId }) => {
  const queryClient = useQueryClient();
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<BatchCreateInput>();

  const days = watch("days") ?? [];
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const teacherId = watch("teacherId");
  const roomId = watch("roomId");

  const [conflicts, setConflicts] = useState<ConflictResult | null>(null);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Quick Add Room Modal state
  const [showQuickAddRoom, setShowQuickAddRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomCapacity, setRoomCapacity] = useState(30);

  // Duration display
  const duration = React.useMemo(() => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const total = eh * 60 + em - (sh * 60 + sm);
    if (total <= 0) return null;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? `${h} hr${h > 1 ? "s" : ""}${m > 0 ? ` ${m} min` : ""}` : `${m} min`;
  }, [startTime, endTime]);

  const { data: teachersData } = useQuery({
    queryKey: ["teachers-select"],
    queryFn: async () => {
      const res = await fetch("/api/admin/teachers?limit=100&status=ACTIVE");
      if (!res.ok) return { teachers: [] };
      return res.json() as Promise<{ teachers: Array<{ id: string; firstName: string; lastName: string; teacherCode: string }> }>;
    },
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) return { rooms: [] };
      return res.json() as Promise<{ rooms: Array<{ id: string; name: string; code: string; capacity: number; isBooked?: boolean }> }>;
    },
  });

  const teachers = teachersData?.teachers ?? [];
  const rooms = roomsData?.rooms ?? [];

  // Conflict check
  useEffect(() => {
    const check = async () => {
      if (!teacherId || !days.length || !startTime || !endTime) return;
      setCheckingConflicts(true);
      try {
        const res = await fetch("/api/admin/conflicts/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            roomId: roomId || undefined,
            days,
            startTime,
            endTime,
            excludeBatchId: editBatchId,
          }),
        });
        if (res.ok) {
          const data = await res.json() as ConflictResult;
          setConflicts(data);
        }
      } finally {
        setCheckingConflicts(false);
      }
    };

    const debounce = setTimeout(check, 600);
    return () => clearTimeout(debounce);
  }, [teacherId, roomId, days, startTime, endTime, editBatchId]);

  // Room quick add mutation
  const addRoomMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; capacity: number }) => {
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create classroom");
      }
      return res.json() as Promise<{ room: { id: string; name: string; code: string; capacity: number } }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      // Automatically select the new room
      setValue("roomId", data.room.id, { shouldValidate: true });
      setShowQuickAddRoom(false);
      setRoomName("");
      setRoomCode("");
      setRoomCapacity(30);
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const handleQuickAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return alert("Room Name is required");
    if (!roomCode.trim()) return alert("Room Code is required");
    if (roomCapacity <= 0) return alert("Capacity must be greater than 0");
    addRoomMutation.mutate({
      name: roomName,
      code: roomCode.toUpperCase(),
      capacity: roomCapacity,
    });
  };

  const toggleDay = (day: string) => {
    const current = days as string[];
    if (current.includes(day)) {
      setValue("days", current.filter((d) => d !== day) as BatchCreateInput["days"]);
    } else {
      setValue("days", [...current, day] as BatchCreateInput["days"]);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <div className="space-y-5">
      {/* Weekly Schedule */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
          Weekly Schedule
        </h2>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              Class Days <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ label, value }) => {
                const selected = (days as string[]).includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      selected
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "border border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.days && <p className={errorClass}>{errors.days.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>
                Start Time <span className="text-red-500">*</span>
              </label>
              <input {...register("startTime")} type="time" className={inputClass} />
              {errors.startTime && <p className={errorClass}>{errors.startTime.message}</p>}
            </div>
            <div>
              <label className={labelClass}>
                End Time <span className="text-red-500">*</span>
              </label>
              <input {...register("endTime")} type="time" className={inputClass} />
              {errors.endTime && <p className={errorClass}>{errors.endTime.message}</p>}
            </div>
            <div className="flex flex-col justify-end">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                <p className="text-xs text-blue-600 dark:text-blue-400">Duration</p>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {duration ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher Assignment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
          Teacher Assignment
        </h2>

        <div>
          <label className={labelClass}>
            Select Teacher <span className="text-red-500">*</span>
          </label>
          <select {...register("teacherId")} className={inputClass}>
            <option value="">Search and select a teacher...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName} ({t.teacherCode})
              </option>
            ))}
          </select>
          {errors.teacherId && <p className={errorClass}>{errors.teacherId.message}</p>}
        </div>

        {teacherId && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              ✓ {teachers.find((t) => t.id === teacherId)?.firstName}{" "}
              {teachers.find((t) => t.id === teacherId)?.lastName} selected
            </p>
          </div>
        )}
      </div>

      {/* Room Assignment */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
          Room Assignment
        </h2>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Room (optional)</label>
            <button
              type="button"
              onClick={() => setShowQuickAddRoom(true)}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
            >
              <Plus size={12} /> Quick Add
            </button>
          </div>
          <select {...register("roomId")} className={inputClass}>
            <option value="">No room assigned (or online)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — Capacity {r.capacity}
                {r.isBooked ? " ⚠️ Potentially booked" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conflict Warnings */}
      {checkingConflicts && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">Checking for conflicts...</p>
        </div>
      )}

      {conflicts && conflicts.hasConflict && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="space-y-2">
              <p className="font-semibold text-red-700 dark:text-red-300">
                Schedule Conflicts Detected
              </p>
              {conflicts.teacherConflicts.map((c, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ Teacher already assigned to <strong>{c.batchName}</strong> on{" "}
                  {c.conflictingDays.join(", ")}
                </p>
              ))}
              {conflicts.roomConflicts.map((c, i) => (
                <p key={i} className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ Room <strong>{c.roomName}</strong> is booked for <strong>{c.batchName}</strong>{" "}
                  on {c.conflictingDays.join(", ")}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {conflicts && !conflicts.hasConflict && teacherId && days.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            ✅ No schedule conflicts detected
          </p>
        </div>
      )}

      {/* Quick Add Room Dialog */}
      {showQuickAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs transition">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Add Classroom</h3>
              <button
                type="button"
                onClick={() => setShowQuickAddRoom(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickAddRoom} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Room Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Room 104"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Room Code *</label>
                <input
                  type="text"
                  placeholder="e.g. R104"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Student Capacity *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddRoom(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addRoomMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-75 transition"
                >
                  {addRoomMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      Saving...
                    </>
                  ) : (
                    "Save Room"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2Schedule;
