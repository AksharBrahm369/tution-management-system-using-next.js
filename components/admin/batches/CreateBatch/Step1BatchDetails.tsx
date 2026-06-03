"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { BatchCreateInput } from "@/lib/validations/batch";

const COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
];

interface Step1Props {
  generatedCode: string;
}

const Step1BatchDetails: React.FC<Step1Props> = ({ generatedCode }) => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<BatchCreateInput>();

  const isOnline = watch("isOnline");
  const selectedColor = watch("color");
  const currentYear = new Date().getFullYear();

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) return { subjects: [] };
      return res.json() as Promise<{ subjects: Array<{ id: string; name: string; code: string }> }>;
    },
  });

  const subjects = subjectsData?.subjects ?? [];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
        Batch Information
      </h2>

      <div className="space-y-5">
        {/* Row 1: Name + Code */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              placeholder="e.g. Class 10 - Mathematics Morning"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Batch Code</label>
            <input
              {...register("code")}
              defaultValue={generatedCode}
              placeholder="BCH-2025-001"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">Auto-generated, editable</p>
          </div>
        </div>

        {/* Row 2: Subject + Academic Year */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Subject <span className="text-red-500">*</span>
            </label>
            <select {...register("subjectId")} className={inputClass}>
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {errors.subjectId && <p className={errorClass}>{errors.subjectId.message}</p>}
          </div>
          <div>
            <label className={labelClass}>
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select {...register("academicYear")} className={inputClass}>
              <option value={`${currentYear}-${String(currentYear + 1).slice(-2)}`}>
                {currentYear}-{String(currentYear + 1).slice(-2)}
              </option>
              <option value={`${currentYear - 1}-${String(currentYear).slice(-2)}`}>
                {currentYear - 1}-{String(currentYear).slice(-2)}
              </option>
              <option value={`${currentYear + 1}-${String(currentYear + 2).slice(-2)}`}>
                {currentYear + 1}-{String(currentYear + 2).slice(-2)}
              </option>
            </select>
            {errors.academicYear && <p className={errorClass}>{errors.academicYear.message}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Optional batch description..."
            className={inputClass}
          />
        </div>



        {/* Row: Fee + Max Strength */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Monthly Fee (₹)</label>
            <input
              {...register("fees")}
              type="number"
              min="0"
              placeholder="1500"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Maximum Strength</label>
            <input
              {...register("maxStrength")}
              type="number"
              min="1"
              placeholder="30"
              className={inputClass}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>
              Start Date <span className="text-red-500">*</span>
            </label>
            <input {...register("startDate")} type="date" className={inputClass} />
            {errors.startDate && <p className={errorClass}>{errors.startDate.message}</p>}
          </div>
          <div>
            <label className={labelClass}>End Date (optional)</label>
            <input {...register("endDate")} type="date" className={inputClass} />
          </div>
        </div>

        {/* Online toggle */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setValue("isOnline", !isOnline)}
            className={`relative h-6 w-11 rounded-full transition-colors ${isOnline ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isOnline ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {isOnline ? "Online Batch" : "Offline Batch"}
            </p>
            <p className="text-xs text-slate-500">
              {isOnline ? "Students attend via video call" : "Students attend in person"}
            </p>
          </div>
        </div>

        {isOnline && (
          <div>
            <label className={labelClass}>Meeting Link</label>
            <input
              {...register("meetingLink")}
              type="url"
              placeholder="https://meet.google.com/abc-defg-hij"
              className={inputClass}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step1BatchDetails;
