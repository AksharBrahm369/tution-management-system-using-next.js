"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { batchUpdateSchema, type BatchUpdateInput } from "@/lib/validations/batch";
import Step1BatchDetails from "@/components/admin/batches/CreateBatch/Step1BatchDetails";
import Step2Schedule from "@/components/admin/batches/CreateBatch/Step2Schedule";

interface EditBatchPageProps {
  batchId: string;
}

const EditBatchPage: React.FC<EditBatchPageProps> = ({ batchId }) => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"details" | "schedule">("details");

  const { data, isLoading } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches/${batchId}`);
      if (!res.ok) throw new Error("Batch not found");
      return res.json() as Promise<{ batch: BatchData }>;
    },
  });

  const form = useForm<BatchUpdateInput>({
    resolver: zodResolver(batchUpdateSchema) as never,
    defaultValues: {},
  });

  useEffect(() => {
    if (data?.batch) {
      const b = data.batch;
      form.reset({
        name: b.name,
        code: b.code,
        description: b.description ?? "",
        color: b.color ?? "",
        subjectId: b.subjectId,
        academicYear: b.academicYear,
        fees: b.fees,
        maxStrength: b.maxStrength,
        startDate: new Date(b.startDate),
        endDate: b.endDate ? new Date(b.endDate) : undefined,
        isOnline: b.isOnline,
        meetingLink: b.meetingLink ?? "",
        days: b.days as BatchUpdateInput["days"],
        startTime: b.startTime,
        endTime: b.endTime,
        teacherId: b.teacherId,
        roomId: b.roomId ?? "",
        scheduleChanged: false,
        generateSessions: false,
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: BatchUpdateInput) => {
      const res = await fetch(`/api/admin/batches/${batchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to update batch");
      }
      return res.json();
    },
    onSuccess: () => router.push(`/admin/batches/${batchId}`),
    onError: (err: Error) => alert(err.message),
  });

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href={`/admin/batches/${batchId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Batch
          </Link>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">Edit Batch</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{data?.batch?.name}</p>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 w-fit">
        {(["details", "schedule"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all ${
              activeSection === s ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            {s === "details" ? "Batch Details" : "Schedule & Teacher"}
          </button>
        ))}
      </div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-5"
        >
          {activeSection === "details" && (
            <Step1BatchDetails generatedCode={data?.batch?.code ?? ""} />
          )}
          {activeSection === "schedule" && (
            <>
              <Step2Schedule editBatchId={batchId} />
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("scheduleChanged")}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Apply schedule changes
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Check this if you changed days, times, teacher, or room. This will re-run conflict detection.
                    </p>
                  </div>
                </label>
                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("generateSessions")}
                    className="mt-0.5 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Regenerate future sessions
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Cancels all future SCHEDULED sessions and regenerates based on new schedule.
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link href={`/admin/batches/${batchId}`} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default EditBatchPage;

interface BatchData {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  description?: string | null;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  days: string[];
  startTime: string;
  endTime: string;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  academicYear: string;
  startDate: string;
  endDate?: string | null;
  isOnline: boolean;
  meetingLink?: string | null;
}
