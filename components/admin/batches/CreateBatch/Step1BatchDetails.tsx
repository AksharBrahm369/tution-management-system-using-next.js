"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2 } from "lucide-react";
import type { BatchCreateInput } from "@/lib/validations/batch";

interface Step1Props {
  generatedCode: string;
}

const Step1BatchDetails: React.FC<Step1Props> = ({ generatedCode }) => {
  const queryClient = useQueryClient();
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<BatchCreateInput>();

  React.useEffect(() => {
    if (generatedCode) {
      setValue("code", generatedCode);
    }
  }, [generatedCode, setValue]);

  const isOnline = watch("isOnline");
  const currentYear = new Date().getFullYear();

  // Quick Add Subject Modal state
  const [showQuickAddSubject, setShowQuickAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) return { subjects: [] };
      return res.json() as Promise<{ subjects: Array<{ id: string; name: string; code: string }> }>;
    },
  });

  const subjects = subjectsData?.subjects ?? [];

  // Subject quick add mutation
  const addSubjectMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string }) => {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create subject");
      }
      return res.json() as Promise<{ subject: { id: string; name: string; code: string } }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      // Automatically select the new subject
      setValue("subjectId", data.subject.id, { shouldValidate: true });
      setShowQuickAddSubject(false);
      setSubjectName("");
      setSubjectCode("");
      setSubjectDesc("");
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const handleQuickAddSubject = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!subjectName.trim()) return alert("Subject Name is required");
    if (!subjectCode.trim()) return alert("Subject Code is required");
    addSubjectMutation.mutate({
      name: subjectName,
      code: subjectCode.toUpperCase(),
      description: subjectDesc,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-blue-400";
  const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-6 text-lg font-semibold text-slate-900 dark:text-white">
        Batch Information
      </h2>

      <div className="space-y-5">
        {/* Row 1: Name */}
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
        <input type="hidden" {...register("code")} />

        {/* Row 2: Subject + Academic Year */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Subject <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddSubject(true)}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
              >
                <Plus size={12} /> Quick Add
              </button>
            </div>
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

      {/* Quick Add Subject Dialog */}
      {showQuickAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs transition">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Add Subject</h3>
              <button
                type="button"
                onClick={() => setShowQuickAddSubject(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div 
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleQuickAddSubject(e);
                }
              }} 
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. History"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Subject Code *</label>
                <input
                  type="text"
                  placeholder="e.g. HIST"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Short description..."
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddSubject(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddSubject()}
                  disabled={addSubjectMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-75 transition"
                >
                  {addSubjectMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      Saving...
                    </>
                  ) : (
                    "Save Subject"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1BatchDetails;
