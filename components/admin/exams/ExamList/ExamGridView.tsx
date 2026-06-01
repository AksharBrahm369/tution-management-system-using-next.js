import React from "react";
import ExamCard from "./ExamCard";
import { Button } from "@/components/ui/button";
import { Plus, FilterX } from "lucide-react";

export default function ExamGridView({ exams, onView, onEnterMarks, onCreate, onReset, hasFilters }: any) {
  if (!exams || exams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
            <FilterX className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {hasFilters ? "No exams match the current filters" : "No exams created yet"}
          </h3>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {hasFilters
              ? "Try clearing the filters or searching with a different keyword."
              : "Create your first exam to start managing results, marks, and publishing workflow."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasFilters ? (
              <Button variant="outline" onClick={onReset} className="rounded-full">
                Clear Filters
              </Button>
            ) : null}
            <Button onClick={onCreate} className="gap-2 rounded-full">
              <Plus className="h-4 w-4" /> Create Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {exams.map((exam: any) => (
        <ExamCard 
          key={exam.id} 
          exam={exam} 
          onView={onView} 
          onEnterMarks={onEnterMarks} 
        />
      ))}
    </div>
  );
}
