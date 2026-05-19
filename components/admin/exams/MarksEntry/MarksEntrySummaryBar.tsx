import { ExamResult } from "../types";

export default function MarksEntrySummaryBar({ rows }: { rows: ExamResult[] }) {
  const entered = rows.filter((row) => row.isAbsent || row.marksObtained !== null).length;
  const absent = rows.filter((row) => row.isAbsent).length;
  const remaining = rows.length - entered;
  const validMarks = rows.filter((row) => row.marksObtained !== null && !row.isAbsent).map((row) => row.marksObtained as number);
  const average = validMarks.length ? (validMarks.reduce((sum, value) => sum + value, 0) / validMarks.length).toFixed(2) : "0.00";

  return (
    <div className="sticky bottom-4 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="grid gap-2 text-sm md:grid-cols-4">
        <p>Entered: <span className="font-medium">{entered}</span></p>
        <p>Absent: <span className="font-medium">{absent}</span></p>
        <p>Remaining: <span className="font-medium">{remaining}</span></p>
        <p>Class Average: <span className="font-medium">{average}</span></p>
      </div>
    </div>
  );
}
