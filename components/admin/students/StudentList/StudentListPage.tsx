"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, LayoutGrid, List, Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

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
  standardId: "ALL",
};

interface StudentListPageProps {
  standardId?: string;
  standardName?: string;
  basePath?: string;
}

const StudentListPage: React.FC<StudentListPageProps> = ({ standardId, standardName, basePath = "/admin/students" }) => {
  const [filters, setFilters] = useState<StudentFiltersState>({ ...defaultFilters, standardId: standardId ?? "ALL" });
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
  }, [debouncedSearch, filters.status, filters.category, filters.batchId, filters.academicYear, filters.standardId, viewMode]);

  const queryFilters = useMemo(() => ({
    search: debouncedSearch,
    status: filters.status,
    category: filters.category,
    batchId: filters.batchId,
    academicYear: filters.academicYear,
    standardId: standardId ?? filters.standardId,
  }), [debouncedSearch, filters.status, filters.category, filters.batchId, filters.academicYear, filters.standardId, standardId]);

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

  const { data: batchesData } = useQuery<{ batches: Array<{ id: string; name: string }> }>({
    queryKey: ["admin-batches-list-options", standardId ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "1000" });
      if (standardId) params.set("standardId", standardId);
      const response = await fetch(`/api/admin/batches?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load batches");
      }
      return response.json();
    },
  });

  const batchOptions = useMemo(() => {
    return batchesData?.batches ?? [];
  }, [batchesData]);

  const { data: standardsData } = useQuery<{ standards: Array<{ id: string; name: string }> }>({
    queryKey: ["admin-standards-options"],
    queryFn: async () => {
      const response = await fetch("/api/admin/standards");
      if (!response.ok) throw new Error("Failed to load standards");
      return response.json();
    },
    enabled: !standardId,
  });

  const students = data?.students ?? [];
  const hasStudents = students.length > 0;
  const addStudentHref = standardId
    ? `/admin/students/add?standardId=${standardId}&returnTo=${encodeURIComponent(basePath)}`
    : "/admin/students/add";

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

  const resetFilters = () => setFilters({ ...defaultFilters, standardId: standardId ?? "ALL" });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(column);
    setSortOrder("asc");
  };

  const pageContent = (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">{standardName ? `${standardName} Students` : "Students"}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{standardName ? `Manage students assigned to ${standardName}` : "Manage all enrolled students"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setImportOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Download size={18} /> Import Excel
          </button>
          <Link href={addStudentHref} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
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

      <StudentFilters filters={filters} onChange={setFilters} onReset={resetFilters} batchOptions={batchOptions} standardOptions={standardsData?.standards ?? []} hideStandardFilter={Boolean(standardId)} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("grid")} aria-label="Show student grid view" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "grid" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <LayoutGrid size={16} /> Grid View
          </button>
          <button onClick={() => setViewMode("table")} aria-label="Show student table view" className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${viewMode === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <List size={16} /> Table View
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && viewMode === "table" && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {selectedIds.length} selected
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-4 animate-pulse">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-850">
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-9 w-20 rounded-xl" />
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60 animate-pulse">
            <div className="bg-slate-50 p-4 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )
      ) : hasStudents ? (
        viewMode === "grid" ? (
          <StudentGridView
            students={students}
            onChangeStatus={setStatusStudent}
            onDownloadId={setIdCardStudent}
            onDelete={handleDelete}
            basePath={basePath}
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
            basePath={basePath}
          />
        )
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto max-w-md">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No students found</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Try clearing filters or add your first student to get started.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={resetFilters} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Clear Search</button>
              <Link href={addStudentHref} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Add First Student</Link>
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
