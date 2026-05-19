import { ExamItem } from "../types";

export default function AnalyticsTab({ exam }: { exam: ExamItem }) {
  const percentages = exam.results.filter((result) => result.percentage !== null).map((result) => result.percentage as number);
  const avg = percentages.length ? (percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(2) : "0.00";
  const high = percentages.length ? Math.max(...percentages).toFixed(2) : "0.00";
  const low = percentages.length ? Math.min(...percentages).toFixed(2) : "0.00";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-xl border p-4 dark:border-slate-700"><p className="text-sm text-slate-500">Class Average</p><p className="text-2xl font-semibold">{avg}%</p></div>
      <div className="rounded-xl border p-4 dark:border-slate-700"><p className="text-sm text-slate-500">Highest</p><p className="text-2xl font-semibold">{high}%</p></div>
      <div className="rounded-xl border p-4 dark:border-slate-700"><p className="text-sm text-slate-500">Lowest</p><p className="text-2xl font-semibold">{low}%</p></div>
      <div className="rounded-xl border p-4 dark:border-slate-700"><p className="text-sm text-slate-500">Students</p><p className="text-2xl font-semibold">{exam.results.length}</p></div>
    </div>
  );
}
