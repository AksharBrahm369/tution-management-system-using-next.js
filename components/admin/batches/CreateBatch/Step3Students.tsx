"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Search, X, AlertTriangle } from "lucide-react";
import type { BatchCreateInput } from "@/lib/validations/batch";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentCode: string;
  status: string;
  batchEnrollments: Array<{ batch: { name: string; subject: { name: string } } }>;
}

const Step3Students: React.FC = () => {
  const { setValue, watch } = useFormContext<BatchCreateInput>();
  const selectedIds = watch("studentIds") ?? [];
  const subjectId = watch("subjectId");
  const skip = watch("skipEnrollment") ?? false;
  const maxStrength = watch("maxStrength") ?? 30;

  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["students-select", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/students?${params}`);
      if (!res.ok) return { students: [] };
      return res.json() as Promise<{ students: Student[] }>;
    },
    enabled: !skip,
  });

  const students = data?.students ?? [];

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setValue("studentIds", selectedIds.filter((s) => s !== id));
    } else {
      if (selectedIds.length >= maxStrength) return;
      setValue("studentIds", [...selectedIds, id]);
    }
  };

  const remove = (id: string) => {
    setValue("studentIds", selectedIds.filter((s) => s !== id));
  };

  const selectedStudents = students.filter((s) => selectedIds.includes(s.id));
  const strengthPct = maxStrength > 0 ? Math.round((selectedIds.length / maxStrength) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Enroll Students
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You can enroll students now or do it later from the batch details page.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={skip}
              onChange={(e) => setValue("skipEnrollment", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Skip for now</span>
          </label>
        </div>

        {/* Strength indicator */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Batch Capacity
            </span>
            <span className={`font-semibold ${strengthPct >= 90 ? "text-red-600" : strengthPct >= 70 ? "text-yellow-600" : "text-emerald-600"}`}>
              {selectedIds.length} / {maxStrength} students
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                strengthPct >= 90 ? "bg-red-500" : strengthPct >= 70 ? "bg-yellow-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(strengthPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {!skip && (
        <>
          {/* Search Students */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students by name, code, or phone..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {students.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No students found</p>
              )}
              {students.map((student) => {
                const isSelected = selectedIds.includes(student.id);
                const hasSameSubject = student.batchEnrollments?.some(
                  (e) => e.batch?.subject?.name && subjectId
                );

                return (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(student.id)}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{student.studentCode}</p>
                    </div>
                    {hasSameSubject && (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <AlertTriangle size={12} /> Same subject
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Selected Students */}
          {selectedIds.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900 dark:bg-slate-900/60">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                Selected Students ({selectedIds.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((s) => (
                  <span
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    {s.firstName} {s.lastName}
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      className="hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Step3Students;
