import { ExamResult } from "../types";
import StudentMarksRow, { EditableMark } from "./StudentMarksRow";

export default function MarksEntryTable({
  rows,
  totalMarks,
  onRowChange,
}: {
  rows: ExamResult[];
  totalMarks: number;
  onRowChange: (change: EditableMark) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Student</th>
            <th className="px-3 py-2 text-left">Marks</th>
            <th className="px-3 py-2 text-left">Absent</th>
            <th className="px-3 py-2 text-left">Percentage</th>
            <th className="px-3 py-2 text-left">Grade</th>
            <th className="px-3 py-2 text-left">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <StudentMarksRow key={row.id} index={index} row={row} totalMarks={totalMarks} onChange={onRowChange} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
