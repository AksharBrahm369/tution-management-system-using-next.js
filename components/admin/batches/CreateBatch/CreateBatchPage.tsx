"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Plus } from "lucide-react";
import { batchCreateSchema, type BatchCreateInput } from "@/lib/validations/batch";
import StepProgress from "./StepProgress";
import Step1BatchDetails from "./Step1BatchDetails";
import Step2Schedule from "./Step2Schedule";
import Step3Students from "./Step3Students";
import Step4Review from "./Step4Review";

interface SuccessResult {
  id: string;
  code: string;
  name: string;
  enrolledCount: number;
  sessionsCount: number;
}

interface CreateBatchPageProps {
  standardId?: string;
  returnHref?: string;
}

const CreateBatchPage: React.FC<CreateBatchPageProps> = ({ standardId = "", returnHref }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessResult | null>(null);

  const { data: codeData } = useQuery({
    queryKey: ["batch-code"],
    queryFn: async () => {
      const res = await fetch("/api/admin/batches/generate-code");
      if (!res.ok) return { code: "" };
      return res.json() as Promise<{ code: string }>;
    },
  });

  const form = useForm<BatchCreateInput>({
    resolver: zodResolver(batchCreateSchema) as never,
    defaultValues: {
      standardId,
      name: "",
      code: codeData?.code ?? "",
      subjectId: "",
      academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
      description: "",
      color: "#3B82F6",
      fees: 0,
      maxStrength: 30,
      isOnline: false,
      meetingLink: "",
      days: [],
      startTime: "",
      endTime: "",
      teacherId: "",
      roomId: "",
      studentIds: [],
      skipEnrollment: false,
      generateSessions: true,
    },
  });

  React.useEffect(() => {
    if (standardId) {
      form.setValue("standardId", standardId, { shouldValidate: true });
    }
  }, [form, standardId]);

  const resetFormForAnotherBatch = () => {
    form.reset({
      standardId,
      name: "",
      code: codeData?.code ?? "",
      subjectId: "",
      academicYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
      description: "",
      color: "#3B82F6",
      fees: 0,
      maxStrength: 30,
      isOnline: false,
      meetingLink: "",
      days: [],
      startTime: "",
      endTime: "",
      teacherId: "",
      roomId: "",
      studentIds: [],
      skipEnrollment: false,
      generateSessions: true,
    });
  };

  const stepFields: Record<number, (keyof BatchCreateInput)[]> = {
    1: ["standardId", "name", "code", "subjectId", "academicYear", "startDate", "maxStrength", "fees"],
    2: ["days", "startTime", "endTime", "teacherId"],
    3: [],
    4: [],
  };

  const onNext = async () => {
    const fields = stepFields[step] ?? [];
    const valid = fields.length > 0 ? await form.trigger(fields) : true;
    if (valid) setStep((s) => Math.min(s + 1, 4));
    else {
      const errs = form.formState.errors;
      const msgs = fields
        .filter((f) => errs[f])
        .map((f) => (errs[f] as { message?: string })?.message ?? f)
        .join("\n");
      if (msgs) alert(`Please fix:\n${msgs}`);
    }
  };

  const onPrev = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Failed to create batch");
      }

      const payload = await res.json() as {
        batch: { id: string; code: string; name: string };
        enrolledCount: number;
        sessionsCount: number;
      };
      setSuccess({
        id: payload.batch.id,
        code: payload.batch.code,
        name: payload.batch.name,
        enrolledCount: payload.enrolledCount,
        sessionsCount: payload.sessionsCount,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href={returnHref ?? "/admin/batches"}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} /> Back to Batches
          </Link>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
            Create New Batch
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Step {step} of 4 — {["Batch Details", "Schedule", "Students", "Review"][step - 1]}
          </p>
        </div>
      </div>

      <StepProgress currentStep={step} totalSteps={4} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          {step === 1 && (
            <Step1BatchDetails
              generatedCode={codeData?.code ?? ""}
              lockedStandardId={standardId || undefined}
            />
          )}
          {step === 2 && <Step2Schedule />}
          {step === 3 && <Step3Students />}
          {step === 4 && <Step4Review />}

          {/* Navigation */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {step < 4 ? "Complete the current step to continue." : "Review and create your batch."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Creating Batch...
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Create Batch
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="text-emerald-500" size={64} />
              <h3 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                Batch Created!
              </h3>
              <p className="mt-2 text-lg font-medium text-slate-700 dark:text-slate-200">
                {success.name}
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {success.code}
              </p>
              <div className="mt-4 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>{success.enrolledCount} students enrolled</span>
                <span>·</span>
                <span>{success.sessionsCount} sessions created</span>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={standardId ? `/admin/standards/${standardId}/batches/${success.id}` : `/admin/batches/${success.id}`}
                className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
              >
                View Batch
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setStep(1);
                  resetFormForAnotherBatch();
                }}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                Create Another Batch
              </button>
              <Link
                href={returnHref ?? "/admin/batches"}
                className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
              >
                Go to Batch List
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBatchPage;
