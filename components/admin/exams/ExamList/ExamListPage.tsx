"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExamFilters from "./ExamFilters";
import ExamStatsBar from "./ExamStatsBar";
import ExamGridView from "./ExamGridView";
import ExamTableView from "./ExamTableView";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamItem } from "../types";

export default function ExamListPage({
  standardId,
  standardName,
  basePath = "/admin/exams",
}: {
  standardId?: string;
  standardName?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({ search: "", status: "ALL", type: "ALL", standardId: "ALL" });
  const [standards, setStandards] = useState<Array<{ id: string; name: string }>>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const createHref = standardId ? `${basePath}/create` : "/admin/exams/create";

  useEffect(() => {
    let active = true;

    const loadExams = async () => {
      if (active) {
        setLoading(true);
        setError(null);
      }

      try {
        const query = new URLSearchParams();
        if (filters.search.trim()) query.set("search", filters.search.trim());
        if (filters.status && filters.status !== "ALL") query.set("status", filters.status);
        if (filters.type && filters.type !== "ALL") query.set("type", filters.type);
        if (standardId) query.set("standardId", standardId);
        else if (filters.standardId !== "ALL") query.set("standardId", filters.standardId);
        const res = await fetch(`/api/admin/exams?${query.toString()}`);
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || "Failed to fetch exams");
        }

        if (active) {
          setExams(payload.exams ?? []);
          setStats(payload.stats ?? null);
        }
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : "Failed to fetch exams");
        }
        console.error("Failed to fetch exams:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadExams();

    return () => {
      active = false;
    };
  }, [filters, standardId, reloadKey]);

  useEffect(() => {
    if (standardId) return;
    fetch("/api/admin/standards")
      .then((res) => (res.ok ? res.json() : { standards: [] }))
      .then((payload) => setStandards(payload.standards ?? []))
      .catch(() => setStandards([]));
  }, [standardId]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ search: "", status: "ALL", type: "ALL", standardId: "ALL" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl dark:border-slate-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Exams</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{standardName ? `${standardName} Exams` : "Exam Management"}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">{standardName ? `Manage tests and results for ${standardName}.` : "Manage tests, assignments, marks, and published results from one clean dashboard."}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => router.push(createHref)} className="gap-2 rounded-full bg-cyan-500 px-5 text-white hover:bg-cyan-600">
              <Plus className="h-4 w-4" /> Create Exam
            </Button>
            <Button variant="outline" onClick={() => setReloadKey((current) => current + 1)} className="gap-2 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
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
            onRefresh={() => setReloadKey((current) => current + 1)}
            onReset={resetFilters}
            filters={filters}
          />
          {!standardId && (
            <select
              aria-label="Filter exams by standard"
              value={filters.standardId}
              onChange={(event) => handleFilterChange("standardId", event.target.value)}
              className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="ALL">All Standards</option>
              {standards.map((standard) => (
                <option key={standard.id} value={standard.id}>{standard.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className="rounded-xl"
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("table")}
            className="rounded-xl"
            aria-label="List view"
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
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 animate-pulse space-y-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-24" /></div>
                <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-28" /></div>
                <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-32" /></div>
                <div className="flex items-center gap-2"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-20" /></div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-2">
                <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-8" /></div>
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 w-full rounded-xl" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        viewMode === "grid" ? (
            <ExamGridView 
              exams={exams} 
            onView={(id: string) => router.push(`${basePath}/${id}`)}
            onEnterMarks={(id: string) => router.push(`${basePath}/${id}/marks`)}
            onCreate={() => router.push(createHref)}
            onReset={resetFilters}
            hasFilters={Boolean(filters.search || filters.status !== "ALL" || filters.type !== "ALL" || filters.standardId !== "ALL")}
          />
        ) : (
          <ExamTableView 
            exams={exams} 
            onView={(id: string) => router.push(`${basePath}/${id}`)}
            onEnterMarks={(id: string) => router.push(`${basePath}/${id}/marks`)}
            onCreate={() => router.push(createHref)}
            onReset={resetFilters}
            hasFilters={Boolean(filters.search || filters.status !== "ALL" || filters.type !== "ALL" || filters.standardId !== "ALL")}
          />
        )
      )}
    </div>
  );
}
