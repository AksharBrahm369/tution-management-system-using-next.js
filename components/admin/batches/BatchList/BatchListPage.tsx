"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Table, CalendarDays, Plus, Settings, Palmtree } from "lucide-react";
import BatchFilters from "./BatchFilters";
import BatchStatsBar from "./BatchStatsBar";
import BatchGridView from "./BatchGridView";
import BatchTableView from "./BatchTableView";
import BatchTimetableView from "./BatchTimetableView";
import RoomManagementModal from "../Modals/RoomManagementModal";
import HolidayManagementModal from "../Modals/HolidayManagementModal";

type View = "grid" | "table" | "timetable";

interface BatchesResponse {
  batches: Batch[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    ongoing: number;
    upcoming: number;
    completed: number;
    totalEnrolled: number;
  };
}

interface Batch {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  status: string;
  days: string[];
  startTime: string;
  endTime: string;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
  room?: { name: string } | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const BatchListPage: React.FC = () => {
  const [view, setView] = useState<View>("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState("");
  const [page, setPage] = useState(1);
  const [showRooms, setShowRooms] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const params = new URLSearchParams({
    page: String(page),
    limit: "12",
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status && { status }),
    ...(subjectId && { subjectId }),
    ...(teacherId && { teacherId }),
    ...(selectedDays.length > 0 && { days: selectedDays.join(",") }),
    ...(timeRange && { timeRange }),
  });

  const { data, isLoading } = useQuery<BatchesResponse>({
    queryKey: ["batches", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches?${params}`);
      if (!res.ok) throw new Error("Failed to load batches");
      return res.json();
    },
  });

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
      const res = await fetch("/api/admin/teachers?limit=100&status=ACTIVE");
      if (!res.ok) return { teachers: [] };
      return res.json() as Promise<{ teachers: Array<{ id: string; firstName: string; lastName: string }> }>;
    },
  });

  const handleDayToggle = useCallback((day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setSubjectId("");
    setTeacherId("");
    setSelectedDays([]);
    setTimeRange("");
    setPage(1);
  };

  const batches = data?.batches ?? [];
  const stats = data?.stats ?? { total: 0, ongoing: 0, upcoming: 0, completed: 0, totalEnrolled: 0 };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Batches</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Manage all tuition batches and schedules</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowRooms(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings size={16} /> Manage Rooms
          </button>
          <button
            onClick={() => setShowHolidays(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Palmtree size={16} /> Manage Holidays
          </button>
          <Link
            href="/admin/batches/add"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} /> Create Batch
          </Link>
        </div>
      </div>

      {/* Stats */}
      <BatchStatsBar stats={stats} />

      {/* Filters */}
      <BatchFilters
        search={search} onSearchChange={setSearch}
        status={status} onStatusChange={setStatus}
        subjects={subjectsData?.subjects ?? []}
        teachers={teachersData?.teachers ?? []}
        subjectId={subjectId} onSubjectChange={setSubjectId}
        teacherId={teacherId} onTeacherChange={setTeacherId}
        selectedDays={selectedDays} onDayToggle={handleDayToggle}
        timeRange={timeRange} onTimeRangeChange={setTimeRange}
        onReset={handleReset}
      />

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">View:</span>
        {[
          { v: "grid" as View, icon: <LayoutGrid size={16} />, label: "Grid" },
          { v: "table" as View, icon: <Table size={16} />, label: "Table" },
          { v: "timetable" as View, icon: <CalendarDays size={16} />, label: "Timetable" },
        ].map(({ v, icon, label }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              view === v
                ? "bg-blue-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {/* Views */}
      {!isLoading && view === "grid" && <BatchGridView batches={batches} />}
      {!isLoading && view === "table" && <BatchTableView batches={batches} />}
      {!isLoading && view === "timetable" && <BatchTimetableView batches={batches} />}

      {/* Pagination */}
      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {data?.totalPages ?? 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data?.totalPages ?? 1, p + 1))}
            disabled={page === (data?.totalPages ?? 1)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showRooms && <RoomManagementModal onClose={() => setShowRooms(false)} />}
      {showHolidays && <HolidayManagementModal onClose={() => setShowHolidays(false)} />}
    </div>
  );
};

export default BatchListPage;
