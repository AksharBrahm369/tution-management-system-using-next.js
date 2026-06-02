"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, LayoutGrid, List, Plus, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import EnquiryStatsBar from "./EnquiryStatsBar";
import KanbanView from "./KanbanView";
import EnquiryTableView from "./EnquiryTableView";
import { EnquiryAnalyticsResponse, EnquiryFiltersState, EnquiryListItem, EnquiryListResponse } from "../types";
import SourceAnalysis from "../Analytics/SourceAnalysis";
import ConversionFunnel from "../Analytics/ConversionFunnel";
import MonthlyTrend from "../Analytics/MonthlyTrend";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

const defaultFilters: EnquiryFiltersState = {
  search: "",
  status: "ALL",
  source: "ALL",
  assignedTo: "",
  from: "",
  to: "",
};

export default function EnquiryListPage() {
  const [filters, setFilters] = useState<EnquiryFiltersState>(defaultFilters);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [page, setPage] = useState(1);
  const [draggedEnquiry, setDraggedEnquiry] = useState<EnquiryListItem | null>(null);
  const [publicFormLink, setPublicFormLink] = useState<string>("/enquiry");

  const debouncedSearch = useDebouncedValue(filters.search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.source, filters.assignedTo, filters.from, filters.to, viewMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicFormLink(`${window.location.origin}/enquiry`);
    }
  }, []);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      status: filters.status,
      source: filters.source,
      assignedTo: filters.assignedTo,
      from: filters.from,
      to: filters.to,
      page,
      limit: viewMode === "kanban" ? 50 : 20,
    }),
    [debouncedSearch, filters.status, filters.source, filters.assignedTo, filters.from, filters.to, page, viewMode]
  );

  const { data, isLoading, refetch } = useQuery<EnquiryListResponse>({
    queryKey: ["admin-enquiries", queryParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
          params.set(key, String(value));
        }
      });
      const response = await fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Failed to load enquiries");
      }
      return response.json();
    },
  });

  const { data: analytics } = useQuery<EnquiryAnalyticsResponse>({
    queryKey: ["admin-enquiries-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/enquiries/analytics", { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Failed to load enquiry analytics");
      }
      return response.json();
    },
  });

  const handleMoveEnquiry = async (enquiryId: string, status: string) => {
    await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ status }),
    });
    await refetch();
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicFormLink);
      alert("Public enquiry form link copied");
    } catch {
      alert(publicFormLink);
    }
  };

  const enquiries = data?.enquiries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900/70 dark:to-slate-950/70 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Lead Management</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Enquiries</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Track enquiries, follow-ups, demo classes, and conversions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleCopyPublicLink} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Copy size={18} /> Public Form Link
          </button>
          <Link href="/admin/enquiries/add" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
            <Plus size={18} /> Add Enquiry
          </Link>
        </div>
      </div>

      {data?.stats ? <EnquiryStatsBar stats={data.stats} /> : null}

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:grid-cols-6">
        <input
          aria-label="Search enquiries"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search enquiries"
          className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 dark:border-slate-700 dark:text-white"
        />
        <select aria-label="Filter enquiries by status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:text-white">
          <option value="ALL">All Status</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="DEMO_SCHEDULED">Demo Scheduled</option>
          <option value="DEMO_DONE">Demo Done</option>
          <option value="INTERESTED">Interested</option>
          <option value="CONVERTED">Converted</option>
          <option value="LOST">Lost</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
        <select aria-label="Filter enquiries by source" value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:text-white">
          <option value="ALL">All Sources</option>
          <option value="WALK_IN">Walk In</option>
          <option value="PHONE_CALL">Phone Call</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="WEBSITE">Website</option>
          <option value="SOCIAL_MEDIA">Social Media</option>
          <option value="REFERRAL">Referral</option>
          <option value="NEWSPAPER">Newspaper</option>
          <option value="PAMPHLET">Pamphlet</option>
          <option value="OTHER">Other</option>
        </select>
        <input aria-label="Filter enquiries by assignee" value={filters.assignedTo} onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value }))} placeholder="Assigned to" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 dark:border-slate-700 dark:text-white" />
        <input aria-label="Filter enquiries from date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
        <input aria-label="Filter enquiries to date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:text-white" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode("kanban")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "kanban" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <LayoutGrid size={16} /> Kanban View
          </button>
          <button onClick={() => setViewMode("table")} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${viewMode === "table" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
            <List size={16} /> Table View
          </button>
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCcw size={16} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Loading enquiries...</div>
      ) : viewMode === "kanban" ? (
        <KanbanView
          enquiries={enquiries}
          onMoveEnquiry={handleMoveEnquiry}
          onDragStart={(enquiry) => setDraggedEnquiry(enquiry)}
        />
      ) : (
        <EnquiryTableView enquiries={enquiries} onMoveEnquiry={handleMoveEnquiry} />
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <SourceAnalysis data={analytics?.sourceAnalysis ?? []} />
        <ConversionFunnel data={analytics?.conversionFunnel ?? []} />
        <MonthlyTrend data={analytics?.monthlyTrend ?? []} conversionRate={analytics?.conversionRate ?? null} />
      </div>
    </div>
  );
}
