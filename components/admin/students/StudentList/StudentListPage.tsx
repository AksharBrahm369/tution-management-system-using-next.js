"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, LayoutGrid, List, Plus, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StudentFiltersState, StudentListItem, StudentListResponse } from "../types";
import StudentFilters from "./StudentFilters";
import StudentGridView from "./StudentGridView";
import StudentTableView from "./StudentTableView";
import StudentPagination from "./StudentPagination";
import StudentStatsBar from "./StudentStatsBar";
import ImportStudentsModal from "../Modals/ImportStudentsModal";
import ChangeStatusModal from "../Modals/ChangeStatusModal";
import StudentIDCardModal from "../Modals/StudentIDCardModal";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

const defaultFilters: StudentFiltersState = {
  search: "",
  status: "ALL",
  category: "ALL",
  batchId: "ALL",
  academicYear: "ALL",
};

const StudentListPage: React.FC = () => {
  const [filters, setFilters] = useState<StudentFiltersState>(defaultFilters);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [statusStudent, setStatusStudent] = useState<StudentListItem | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<StudentListItem | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(filters.search, 400);

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [debouncedSearch, filters.status, filters.category, filters.batchId, filters.academicYear, viewMode]);

  const queryFilters = useMemo(() => ({
    search: debouncedSearch,
    status: filters.status,
    category: filters.category,
    batchId: filters.batchId,
    academicYear: filters.academicYear,
  }), [debouncedSearch, filters.status, filters.category, filters.batchId, filters.academicYear]);

  const { data, isLoading, refetch } = useQuery<StudentListResponse>({
    queryKey: ["admin-students", queryFilters, page, viewMode, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", viewMode === "grid" ? "12" : "15");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      Object.entries(queryFilters).forEach(([key, value]) => {
        if (value && value !== "ALL") {
          params.set(key, value);
        }
      });

      const response = await fetch(`/api/admin/students?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load students");
      }
      return response.json();
    },
  });

  const batchOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    data?.students.forEach((student) => {
      if (student.batch && !unique.has(student.batch.id)) {
        unique.set(student.batch.id, { id: student.batch.id, name: student.batch.name });
      }
    });
    return Array.from(unique.values());
  }, [data?.students]);

  const students = data?.students ?? [];
  const hasStudents = students.length > 0;

  const toggleSelected = (studentId: string) => {
    setSelectedIds((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  };

  const toggleAll = (studentIds: string[]) => {
    const allSelected = studentIds.every((studentId) => selectedIds.includes(studentId));
    setSelectedIds(allSelected ? [] : studentIds);
  };

  const handleDelete = async (student: StudentListItem) => {
    const confirmed = window.confirm(`Delete ${student.fullName}? This will mark the student inactive.`);
    if (!confirmed) return;

    setDeleteStudentId(student.id);
    try {
      const response = await fetch(`/api/admin/students/${student.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete student");
      refetch();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete student");
    } finally {
      setDeleteStudentId(null);
    }
  };

  const resetFilters = () => setFilters(defaultFilters);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  };

  const pageContent = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Student Management</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Students</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage all enrolled students</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Download size={18} /> Import Excel
          </button>
          <Link href="/admin/students/add" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            <Plus size={18} /> Add Student
          </Link>
        </div>
      </div>

      <StudentStatsBar
        total={data?.stats.total ?? 0}
        active={data?.stats.active ?? 0}
        inactive={data?.stats.inactive ?? 0}
        onLeave={data?.stats.onLeave ?? 0}
      />

      <StudentFilters filters={filters} onChange={setFilters} onReset={resetFilters} batchOptions={batchOptions} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("grid")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "grid" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <LayoutGrid size={16} /> Grid View
          </button>
          <button onClick={() => setViewMode("table")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <List size={16} /> Table View
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCcw size={16} /> Refresh
          </button>
          {selectedIds.length > 0 && viewMode === "table" && (
            <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              {selectedIds.length} selected
            </div>
          )}
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <ChevronDown size={16} /> Bulk Actions
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60" />
          ))}
        </div>
      ) : hasStudents ? (
        viewMode === "grid" ? (
          <StudentGridView
            students={students}
            onChangeStatus={setStatusStudent}
            onDownloadId={setIdCardStudent}
            onDelete={handleDelete}
          />
        ) : (
          <StudentTableView
            students={students}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onToggleAll={toggleAll}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        )
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mx-auto max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No students found</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Try clearing filters or add your first student to get started.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={resetFilters} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Clear Search</button>
              <Link href="/admin/students/add" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add First Student</Link>
            </div>
          </div>
        </div>
      )}

      <StudentPagination
        page={data?.page ?? 1}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        pageSize={viewMode === "grid" ? 12 : 15}
        onPageChange={setPage}
      />

      <ImportStudentsModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={() => refetch()} />
      {statusStudent && (
        <ChangeStatusModal
          studentId={statusStudent.id}
          currentStatus={statusStudent.status}
          onClose={() => setStatusStudent(null)}
          onUpdated={() => {
            setStatusStudent(null);
            refetch();
          }}
        />
      )}
      {idCardStudent && (
        <StudentIDCardModal
          student={{
            id: idCardStudent.id,
            fullName: idCardStudent.fullName,
            studentCode: idCardStudent.studentCode,
            phone: idCardStudent.phone,
            academicYear: idCardStudent.academicYear,
            profilePhoto: idCardStudent.profilePhoto,
            batch: idCardStudent.batch,
          }}
          onClose={() => setIdCardStudent(null)}
        />
      )}
    </div>
  );

  return pageContent;
};

export default StudentListPage;
