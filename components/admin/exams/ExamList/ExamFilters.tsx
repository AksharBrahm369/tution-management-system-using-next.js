import React from "react";
import { Search, Filter, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function ExamFilters({ onSearch, onFilterChange, onRefresh }: any) {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input 
          placeholder="Search exams by name or code..." 
          className="pl-9 bg-gray-50 dark:bg-gray-900 border-none"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap md:flex-nowrap gap-3">
        <Select onValueChange={(val) => onFilterChange('status', val)}>
          <SelectTrigger className="w-[140px] bg-gray-50 dark:bg-gray-900 border-none">
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

        <Select onValueChange={(val) => onFilterChange('type', val)}>
          <SelectTrigger className="w-[140px] bg-gray-50 dark:bg-gray-900 border-none">
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

        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
