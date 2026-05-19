"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamItem, ExamResult } from "../types";
import MarksEntryTable from "./MarksEntryTable";
import MarksEntrySummaryBar from "./MarksEntrySummaryBar";
import SubmitConfirmModal from "./SubmitConfirmModal";
import ImportMarksModal from "./ImportMarksModal";
import { EditableMark } from "./StudentMarksRow";

export default function MarksEntryPage({ exam }: { exam: ExamItem }) {
  const router = useRouter();
  const [rows, setRows] = useState<ExamResult[]>(exam.results);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const progress = useMemo(() => {
    const entered = rows.filter((row) => row.isAbsent || row.marksObtained !== null).length;
    return `${entered}/${rows.length}`;
  }, [rows]);

  const updateRow = (change: EditableMark) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentId === change.studentId
          ? {
              ...row,
              marksObtained: change.marksObtained,
              isAbsent: change.isAbsent,
              teacherRemarks: change.teacherRemarks,
              weakAreas: change.weakAreas,
            }
          : row
      )
    );
  };

  const submit = async (opts: { calculateRanks: boolean; publishNow: boolean; notifyParents: boolean }) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/exams/${exam.id}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          results: rows.map((row) => ({
            studentId: row.studentId,
            marksObtained: row.marksObtained,
            isAbsent: row.isAbsent,
            teacherRemarks: row.teacherRemarks ?? "",
            weakAreas: row.weakAreas,
          })),
          ...opts,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to submit marks");
      }

      setShowConfirm(false);
      router.push(`/admin/exams/${exam.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit marks");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="rounded-2xl border p-4 dark:border-slate-700">
        <h1 className="text-xl font-semibold">Marks Entry</h1>
        <p className="mt-1 text-sm text-slate-500">{exam.title} | {new Date(exam.examDate).toLocaleDateString()} | Progress: {progress}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setShowImport(true)}>Import Marks Excel</button>
        <a href={`/api/admin/exams/${exam.id}/marks/template`} className="rounded-lg border px-3 py-2 text-sm">Download Template</a>
      </div>

      <MarksEntryTable rows={rows} totalMarks={exam.totalMarks} onRowChange={updateRow} />
      <MarksEntrySummaryBar rows={rows} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button className="rounded-lg border px-4 py-2">Save Draft</button>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60" disabled={submitting} onClick={() => setShowConfirm(true)}>
          Submit All Marks
        </button>
      </div>

      {showConfirm && <SubmitConfirmModal onClose={() => setShowConfirm(false)} onConfirm={submit} />}
      {showImport && <ImportMarksModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
