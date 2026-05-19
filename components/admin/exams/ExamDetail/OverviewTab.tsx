import { ExamItem } from "../types";

export default function OverviewTab({ exam }: { exam: ExamItem }) {
  const summary = exam.summary;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="font-medium">Exam Info</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Academic Year: {exam.academicYear}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">Duration: {exam.duration ?? "-"} minutes</p>
      </div>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="font-medium">Results Summary</h3>
        <p className="mt-2 text-sm">Highest: {summary?.highest ?? 0}</p>
        <p className="text-sm">Lowest: {summary?.lowest ?? 0}</p>
        <p className="text-sm">Average: {summary?.average ?? 0}</p>
      </div>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="font-medium">Outcome</h3>
        <p className="mt-2 text-sm">Pass: {summary?.passCount ?? 0}</p>
        <p className="text-sm">Fail: {summary?.failCount ?? 0}</p>
        <p className="text-sm">Absent: {summary?.absentCount ?? 0}</p>
      </div>
    </div>
  );
}
