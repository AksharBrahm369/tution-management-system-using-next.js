"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Radio } from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LogsStatsBar from "./LogsStatsBar";
import LogsFilters, { type LogsFilterState } from "./LogsFilters";
import LogsTable from "./LogsTable";
import LogDetailModal from "./LogDetailModal";
import SecurityEventsSection from "./SecurityEventsSection";
import UserActivityTimeline from "./UserActivityTimeline";
import LiveLogFeed from "./LiveLogFeed";
import type {
  ActivityLogRow,
  ActivityLogsListResponse,
  SecurityEventsResponse,
} from "@/types/activityLog";

const defaultFilters: LogsFilterState = {
  search: "",
  category: "ALL",
  severity: "ALL",
  userId: "",
  fromDate: "",
  toDate: "",
  status: "",
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ActivityLogsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LogsFilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [liveMode, setLiveMode] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLogRow | null>(null);
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const [timelineUserId, setTimelineUserId] = useState("");

  const debouncedSearch = useDebouncedValue(filters.search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.category, filters.severity, filters.userId, filters.fromDate, filters.toDate, filters.status]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.category !== "ALL") params.set("category", filters.category);
    if (filters.severity !== "ALL") params.set("severity", filters.severity);
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);
    if (filters.status) params.set("status", filters.status);
    params.set("page", String(page));
    params.set("limit", "25");
    return params.toString();
  }, [debouncedSearch, filters, page]);

  const { data, isLoading, isError, error, refetch } = useQuery<ActivityLogsListResponse>({
    queryKey: ["admin-activity-logs", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs?${queryString}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
    refetchInterval: liveMode ? false : undefined,
  });

  const { data: security, isLoading: securityLoading } = useQuery<SecurityEventsResponse>({
    queryKey: ["admin-logs-security"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs/security", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load security events");
      return res.json();
    },
    refetchInterval: liveMode ? 10_000 : 60_000,
  });

  const { data: actorsData } = useQuery<{ users: Array<{ id: string; name: string; role: string }> }>({
    queryKey: ["admin-logs-actors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs/actors", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const actors = actorsData?.users ?? [];

  const handleNewLogs = useCallback(
    (incoming: ActivityLogRow[]) => {
      const ids = new Set(incoming.map((l) => l.id));
      setHighlightIds(ids);
      window.setTimeout(() => setHighlightIds(new Set()), 3000);
      void queryClient.invalidateQueries({ queryKey: ["admin-activity-logs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-logs-security"] });
    },
    [queryClient]
  );

  const handleExport = (format: "excel" | "pdf") => {
    const params = new URLSearchParams(queryString);
    params.set("format", format);
    window.open(`/api/admin/logs/export?${params.toString()}`, "_blank");
  };

  const highlightParam = searchParams.get("highlight");
  useEffect(() => {
    if (!highlightParam) return;
    void fetch(`/api/admin/logs/${highlightParam}`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body: { log?: ActivityLogRow }) => {
        if (body.log) setSelectedLog(body.log);
      })
      .catch(() => undefined);
  }, [highlightParam]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <PageShell
      title="Activity Logs"
      description="Audit trail of all important system actions across TuitionPro"
      actions={
        <>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
            <Radio className={`h-4 w-4 ${liveMode ? "animate-pulse text-emerald-500" : "text-slate-400"}`} />
            <Label htmlFor="live-mode" className="text-sm font-medium">
              Live Mode
            </Label>
            <Switch id="live-mode" checked={liveMode} onCheckedChange={setLiveMode} />
          </div>
          <Button type="button" onClick={() => handleExport("excel")}>
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </>
      }
    >
      <LiveLogFeed enabled={liveMode} onNewLogs={handleNewLogs} />

      <LogsStatsBar stats={data?.stats} isLoading={isLoading} />

      <SecurityEventsSection data={security} isLoading={securityLoading} />

      <LogsFilters
        filters={filters}
        actors={actors}
        onChange={setFilters}
        onReset={() => {
          setFilters(defaultFilters);
          setPage(1);
        }}
        onExport={handleExport}
      />

      {isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center space-y-4 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/20 my-4">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
            {error instanceof Error ? error.message : "Failed to load activity logs"}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition active:scale-95 shadow-md"
          >
            Retry
          </button>
        </div>
      ) : (
        <LogsTable
          logs={data?.logs ?? []}
          highlightIds={highlightIds}
          onViewDetails={setSelectedLog}
          isLoading={isLoading}
        />
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {data.page} of {totalPages} · {data.total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <UserActivityTimeline
        actors={actors}
        selectedUserId={timelineUserId}
        onUserChange={setTimelineUserId}
      />

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </PageShell>
  );
}
