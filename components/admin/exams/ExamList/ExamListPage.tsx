"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamFilters from "./ExamFilters";
import ExamStatsBar from "./ExamStatsBar";
import ExamGridView from "./ExamGridView";
import ExamTableView from "./ExamTableView";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExamListPage() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({ search: "", status: "ALL", type: "ALL" });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters);
      const res = await fetch(`/api/admin/exams?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams);
        setStats(data.stats);
      }
    } catch (error) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Exam Management</h1>
          <p className="text-gray-500 mt-1">Manage tests, assignments, and results for all batches.</p>
        </div>
        <Button onClick={() => router.push("/admin/exams/create")} className="gap-2">
          <Plus className="h-4 w-4" /> Create Exam
        </Button>
      </div>

      <ExamStatsBar stats={stats} />

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 mr-4">
          <ExamFilters 
            onSearch={(val: string) => handleFilterChange("search", val)}
            onFilterChange={handleFilterChange}
            onRefresh={fetchExams}
          />
        </div>
        <div className="bg-white dark:bg-gray-800 p-1 rounded-md border flex">
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        viewMode === "grid" ? (
          <ExamGridView 
            exams={exams} 
            onView={(id: string) => router.push(`/admin/exams/${id}`)}
            onEnterMarks={(id: string) => router.push(`/admin/exams/${id}/marks`)}
          />
        ) : (
          <ExamTableView 
            exams={exams} 
            onView={(id: string) => router.push(`/admin/exams/${id}`)}
            onEnterMarks={(id: string) => router.push(`/admin/exams/${id}/marks`)}
          />
        )
      )}
    </div>
  );
}
