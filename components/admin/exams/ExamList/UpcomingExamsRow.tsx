import React from "react";
import Link from "next/link";
import { ExamItem } from "../types";

export default function UpcomingExamsRow({ exams }: { exams: ExamItem[] }) {
  const now = Date.now();
  const week = now + 7 * 24 * 60 * 60 * 1000;
  const upcoming = exams.filter((exam) => {
    const time = new Date(exam.examDate).getTime();
    return time >= now && time <= week;
  });
  if (!upcoming.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Upcoming This Week</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {upcoming.map((exam) => (
          <div key={exam.id} className="min-w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{exam.type.replace("_", " ")}</span>
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{exam.title}</h3>
            <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <div>{new Date(exam.examDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</div>
              <div>{exam.startTime ?? "-"} - {exam.endTime ?? "-"}</div>
              <div>{exam.subject.name}</div>
              <div>{exam.studentCount ?? exam.results.length} students</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700" href={`/admin/exams/${exam.id}`}>View</Link>
              <Link className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white" href={`/admin/exams/${exam.id}/marks`}>Marks Entry</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
