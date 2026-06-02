"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, Search, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamFilters from "./ExamFilters";
import ExamStatsBar from "./ExamStatsBar";
import ExamGridView from "./ExamGridView";
import ExamTableView from "./ExamTableView";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamListPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({ search: "", status: "ALL", type: "ALL" });

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filters.search.trim()) query.set("search", filters.search.trim());
      if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
      if (filters.type && filters.type !== "ALL") query.set("type", filters.type);
      const res = await fetch(`/api/admin/exams?${query.toString()}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to fetch exams");
      }

      setExams(payload.exams ?? []);
      setStats(payload.stats ?? null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch exams");
      console.error("Failed to fetch exams:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "ALL", type: "ALL" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl dark:border-slate-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Exams</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Exam Management</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Manage tests, assignments, marks, and published results from one clean dashboard.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => router.push("/admin/exams/create")} className="gap-2 rounded-full bg-cyan-500 px-5 text-white hover:bg-cyan-600">
              <Plus className="h-4 w-4" /> Create Exam
            </Button>
            <Button variant="outline" onClick={fetchExams} className="gap-2 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <ExamStatsBar stats={stats} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1">
          <ExamFilters
            onSearch={(val: string) => handleFilterChange("search", val)}
            onFilterChange={handleFilterChange}
            onRefresh={fetchExams}
            onReset={resetFilters}
            filters={filters}
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className="rounded-xl"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("table")}
            className="rounded-xl"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-[250px] w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        viewMode === "grid" ? (
          <ExamGridView 
            exams={exams} 
            onView={(id: string) => router.push(`/admin/exams/${id}`)}
            onEnterMarks={(id: string) => router.push(`/admin/exams/${id}/marks`)}
            onCreate={() => router.push("/admin/exams/create")}
            onReset={resetFilters}
            hasFilters={Boolean(filters.search || filters.status !== "ALL" || filters.type !== "ALL")}
          />
        ) : (
          <ExamTableView 
            exams={exams} 
            onView={(id: string) => router.push(`/admin/exams/${id}`)}
            onEnterMarks={(id: string) => router.push(`/admin/exams/${id}/marks`)}
            onCreate={() => router.push("/admin/exams/create")}
            onReset={resetFilters}
            hasFilters={Boolean(filters.search || filters.status !== "ALL" || filters.type !== "ALL")}
          />
        )
      )}
    </div>
  );
}
