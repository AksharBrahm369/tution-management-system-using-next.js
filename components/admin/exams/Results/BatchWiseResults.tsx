import { ExamItem } from "../types";

export default function BatchWiseResults({ exams }: { exams: ExamItem[] }) {
  return (
    <div className="space-y-3">
      {exams.map((exam) => (
        <div key={exam.id} className="rounded-xl border p-4 dark:border-slate-700">
          <p className="font-medium">{exam.title}</p>
          <p className="text-sm text-slate-500">{exam.batch.name} | {new Date(exam.examDate).toLocaleDateString()}</p>
          <p className="mt-1 text-sm">Average: {exam.summary?.average ?? 0}%</p>
        </div>
      ))}
    </div>
  );
}
