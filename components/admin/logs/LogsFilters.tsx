"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LOG_CATEGORIES = [
  "AUTH",
  "STUDENT",
  "TEACHER",
  "BATCH",
  "ATTENDANCE",
  "FEE",
  "EXAM",
  "COMMUNICATION",
  "SETTINGS",
  "USER_MANAGEMENT",
  "REPORT",
  "ENQUIRY",
  "SYSTEM",
] as const;

const LOG_SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;

export interface LogsFilterState {
  search: string;
  category: string;
  severity: string;
  userId: string;
  fromDate: string;
  toDate: string;
  status: string;
}

interface ActorOption {
  id: string;
  name: string;
  role: string;
}

interface LogsFiltersProps {
  filters: LogsFilterState;
  actors: ActorOption[];
  onChange: (filters: LogsFilterState) => void;
  onReset: () => void;
  onExport: (format: "excel" | "pdf") => void;
}

const CATEGORIES = ["ALL", ...LOG_CATEGORIES] as const;
const SEVERITIES = ["ALL", ...LOG_SEVERITIES] as const;

export default function LogsFilters({
  filters,
  actors,
  onChange,
  onReset,
  onExport,
}: LogsFiltersProps) {
  const set = (patch: Partial<LogsFilterState>) => onChange({ ...filters, ...patch });

  return (
    <div className="tp-card animate-scale-in p-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Input
          placeholder="Search action, user, entity…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="lg:col-span-2"
        />
        <select
          className="tp-input h-10 py-0"
          value={filters.category}
          onChange={(e) => set({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "All categories" : c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          className="tp-input h-10 py-0"
          value={filters.severity}
          onChange={(e) => set({ severity: e.target.value })}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All severities" : s}
            </option>
          ))}
        </select>
        <select
          className="tp-input h-10 py-0"
          value={filters.userId}
          onChange={(e) => set({ userId: e.target.value })}
        >
          <option value="">All users</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
        <select
          className="tp-input h-10 py-0"
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <Input
          type="date"
          value={filters.fromDate}
          onChange={(e) => set({ fromDate: e.target.value })}
        />
        <Input
          type="date"
          value={filters.toDate}
          onChange={(e) => set({ toDate: e.target.value })}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onExport("excel")}>
          Export Excel
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onExport("pdf")}>
          Export PDF
        </Button>
      </div>
    </div>
  );
}
