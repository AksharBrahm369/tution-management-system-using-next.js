"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "./StepProgress";
import Step1ExamDetails from "./Step1ExamDetails";
import Step2MarksConfig from "./Step2MarksConfig";
import Step3QuestionSetup from "./Step3QuestionSetup";
import Step4Review from "./Step4Review";
import { CreateExamForm } from "./CreateExamTypes";
import { BatchOption, SubjectOption } from "../types";

const initialForm: CreateExamForm = {
  title: "",
  code: "",
  type: "UNIT_TEST",
  deliveryMode: "OFFLINE",
  standardId: "",
  batchId: "",
  subjectId: "",
  academicYear: "2025-26",
  description: "",
  examDate: "",
  startTime: "",
  endTime: "",
  duration: 0,
  totalMarks: 100,
  passingMarks: 35,
  hasNegativeMarking: false,
  negativeMarkValue: 0,
  gradingSystem: "PERCENTAGE",
  questions: [],
};

export default function CreateExamPage({
  batches,
  subjects,
  standardId = "",
  basePath = "/admin/exams",
}: {
  batches: BatchOption[];
  subjects: SubjectOption[];
  standardId?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateExamForm>({ ...initialForm, standardId });

  const studentCount = useMemo(() => {
    const batch = batches.find((b) => b.id === form.batchId);
    return batch?.enrollments?.length ?? 0;
  }, [batches, form.batchId]);

  const createExam = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const isOnlineExam = form.deliveryMode === "ONLINE";
      const response = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          type: isOnlineExam ? "ONLINE_TEST" : form.type,
          examDate: form.examDate,
          questions: isOnlineExam ? form.questions : [],
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to create exam");
      }

      const payload = await response.json();
      router.push(`${basePath}/${payload.exam.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create Exam</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Multi-step wizard for exam and result configuration.</p>
      </div>

      <StepProgress step={step} />

      {step === 1 && (
        <Step1ExamDetails
          form={form}
          batches={batches}
          subjects={subjects}
          onChange={setForm}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2MarksConfig
          form={form}
          onChange={setForm}
          onPrevious={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3QuestionSetup
          form={form}
          subjects={subjects}
          onChange={setForm}
          onPrevious={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4Review
          form={form}
          studentCount={studentCount}
          submitting={submitting}
          error={error}
          onPrevious={() => setStep(3)}
          onSubmit={createExam}
        />
      )}
    </div>
  );
}
