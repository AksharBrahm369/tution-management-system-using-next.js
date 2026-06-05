import React from "react";
import { Search } from "lucide-react";
import { StudentFiltersState } from "../types";

interface StudentFiltersProps {
  filters: StudentFiltersState;
  onChange: (next: StudentFiltersState) => void;
  onReset: () => void;
  batchOptions: Array<{ id: string; name: string }>;
  standardOptions?: Array<{ id: string; name: string }>;
  hideStandardFilter?: boolean;
}

const baseSelect = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const StudentFilters: React.FC<StudentFiltersProps> = ({ filters, onChange, onReset, batchOptions, standardOptions = [], hideStandardFilter = false }) => {
  const hasActiveFilters = Boolean(filters.search || filters.status !== "ALL" || filters.category !== "ALL" || filters.batchId !== "ALL" || filters.academicYear !== "ALL" || filters.standardId !== "ALL");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex-1">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            aria-label="Search students"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Search by name, email, student code, phone..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filter students by status" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })} className={baseSelect}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="GRADUATED">Graduated</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>

        <select aria-label="Filter students by category" value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className={baseSelect}>
          <option value="ALL">All Categories</option>
          <option value="WEAK">Weak</option>
          <option value="AVERAGE">Average</option>
          <option value="GOOD">Good</option>
          <option value="TOPPER">Topper</option>
        </select>

        <select aria-label="Filter students by batch" value={filters.batchId} onChange={(event) => onChange({ ...filters, batchId: event.target.value })} className={baseSelect}>
          <option value="ALL">All Batches</option>
          {batchOptions.map((batch) => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>

        {!hideStandardFilter && (
          <select aria-label="Filter students by standard" value={filters.standardId} onChange={(event) => onChange({ ...filters, standardId: event.target.value })} className={baseSelect}>
            <option value="ALL">All Standards</option>
            {standardOptions.map((standard) => (
              <option key={standard.id} value={standard.id}>{standard.name}</option>
            ))}
          </select>
        )}

        <select aria-label="Filter students by academic year" value={filters.academicYear} onChange={(event) => onChange({ ...filters, academicYear: event.target.value })} className={baseSelect}>
          <option value="ALL">All Years</option>
          <option value="2024-25">2024-25</option>
          <option value="2025-26">2025-26</option>
          <option value="2026-27">2026-27</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentFilters;
