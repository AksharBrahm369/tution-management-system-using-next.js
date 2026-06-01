import React from "react";
import { Search, Filter, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ExamFilters({ onSearch, onFilterChange, onRefresh, onReset, filters }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            value={filters?.search ?? ""}
            placeholder="Search exams by name, code, batch, or subject..." 
            className="h-12 border-slate-200 bg-slate-50 pl-9 dark:border-slate-700 dark:bg-slate-950/40"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={filters?.status ?? "ALL"} onValueChange={(val) => onFilterChange("status", val)}>
            <SelectTrigger className="w-[165px] border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="RESULT_PENDING">Result Pending</SelectItem>
              <SelectItem value="RESULT_PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters?.type ?? "ALL"} onValueChange={(val) => onFilterChange("type", val)}>
            <SelectTrigger className="w-[165px] border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40">
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="UNIT_TEST">Unit Test</SelectItem>
              <SelectItem value="MID_TERM">Mid Term</SelectItem>
              <SelectItem value="FINAL">Final</SelectItem>
              <SelectItem value="ONLINE_TEST">Online Test</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onRefresh} className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onReset} className="h-12 rounded-xl px-4 text-slate-600 dark:text-slate-300">
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
