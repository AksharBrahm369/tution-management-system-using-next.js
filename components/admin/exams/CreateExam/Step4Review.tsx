import React from "react";
import { CreateExamForm } from "./CreateExamTypes";

export default function Step4Review({
  form,
  studentCount,
  submitting,
  error,
  onPrevious,
  onSubmit,
}: {
  form: CreateExamForm;
  studentCount: number;
  submitting: boolean;
  error: string | null;
  onPrevious: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Review and Create</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-4 dark:border-slate-700">
          <h3 className="font-medium">Exam Details</h3>
          <p className="mt-2 text-sm">{form.title}</p>
          <p className="text-sm text-slate-500">{form.code || "Code will be generated"}</p>
          <p className="text-sm text-slate-500">Category: {form.type.replaceAll("_", " ")}</p>
          <p className="text-sm text-slate-500">Mode: {form.deliveryMode === "ONLINE" ? "Online" : "Offline"}</p>
          <p className="text-sm text-slate-500">{form.examDate}</p>
        </div>

        <div className="rounded-xl border p-4 dark:border-slate-700">
          <h3 className="font-medium">Marks Configuration</h3>
          <p className="mt-2 text-sm">Total Marks: {form.totalMarks}</p>
          <p className="text-sm">Passing Marks: {form.passingMarks}</p>
          <p className="text-sm">Grading System: {form.gradingSystem.replaceAll("_", " ")}</p>
          <p className="text-sm">Negative Marking: {form.hasNegativeMarking ? `Yes (${form.negativeMarkValue})` : "No"}</p>
        </div>

        <div className="rounded-xl border p-4 dark:border-slate-700">
          <h3 className="font-medium">Students Included</h3>
          <p className="mt-2 text-sm">All {studentCount} active students in selected batch will be included.</p>
        </div>

        <div className="rounded-xl border p-4 dark:border-slate-700">
          <h3 className="font-medium">Question Summary</h3>
          <p className="mt-2 text-sm">Total Questions: {form.questions.length}</p>
          <p className="text-sm">Question Marks Total: {form.questions.reduce((sum, q) => sum + q.marks, 0)}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button className="rounded-xl border px-5 py-2" onClick={onPrevious} disabled={submitting}>Previous</button>
        <button className="rounded-xl bg-blue-600 px-5 py-2 text-white disabled:opacity-60" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create Exam"}
        </button>
      </div>
    </div>
  );
}
