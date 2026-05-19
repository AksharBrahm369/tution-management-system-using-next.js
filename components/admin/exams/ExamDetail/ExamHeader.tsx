import Link from "next/link";
import { ExamItem } from "../types";

export default function ExamHeader({ exam }: { exam: ExamItem }) {
  const entered = exam.summary?.enteredCount ?? exam.enteredCount ?? 0;
  const total = exam.summary?.studentCount ?? exam.studentCount ?? exam.results.length;
  const progress = total > 0 ? Math.round((entered / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{exam.title}</h1>
          <p className="text-sm text-slate-500">{exam.code}</p>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{exam.type.replaceAll("_", " ")}</span>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{exam.status.replaceAll("_", " ")}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/exams/${exam.id}/marks`} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Enter Marks</Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4">
        <p>Subject: <span className="font-medium">{exam.subject.name}</span></p>
        <p>Batch: <span className="font-medium">{exam.batch.name}</span></p>
        <p>Date: <span className="font-medium">{new Date(exam.examDate).toLocaleDateString()}</span></p>
        <p>Total/Pass: <span className="font-medium">{exam.totalMarks}/{exam.passingMarks}</span></p>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Results entered: {entered}/{total}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
          <div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
