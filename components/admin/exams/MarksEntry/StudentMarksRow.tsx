import { ExamResult } from "../types";

export type EditableMark = {
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  teacherRemarks: string;
  weakAreas: string[];
};

export default function StudentMarksRow({
  index,
  row,
  totalMarks,
  onChange,
}: {
  index: number;
  row: ExamResult;
  totalMarks: number;
  onChange: (value: EditableMark) => void;
}) {
  const marks = row.marksObtained ?? 0;
  const percentage = row.isAbsent ? 0 : Number(((marks / totalMarks) * 100).toFixed(2));

  return (
    <tr className="border-t dark:border-slate-700">
      <td className="px-3 py-2">{index + 1}</td>
      <td className="px-3 py-2">{row.student.firstName} {row.student.lastName}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          className="w-24 rounded border px-2 py-1"
          min={0}
          max={totalMarks}
          value={row.marksObtained ?? ""}
          disabled={row.isAbsent}
          onChange={(e) => onChange({
            studentId: row.studentId,
            marksObtained: e.target.value === "" ? null : Number(e.target.value),
            isAbsent: row.isAbsent,
            teacherRemarks: row.teacherRemarks ?? "",
            weakAreas: row.weakAreas,
          })}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={row.isAbsent}
          onChange={(e) => onChange({
            studentId: row.studentId,
            marksObtained: e.target.checked ? null : row.marksObtained,
            isAbsent: e.target.checked,
            teacherRemarks: row.teacherRemarks ?? "",
            weakAreas: row.weakAreas,
          })}
        />
      </td>
      <td className="px-3 py-2">{row.isAbsent ? "-" : `${percentage}%`}</td>
      <td className="px-3 py-2">{row.grade ?? "-"}</td>
      <td className="px-3 py-2">
        <input
          className="w-full rounded border px-2 py-1"
          value={row.teacherRemarks ?? ""}
          onChange={(e) => onChange({
            studentId: row.studentId,
            marksObtained: row.marksObtained,
            isAbsent: row.isAbsent,
            teacherRemarks: e.target.value,
            weakAreas: row.weakAreas,
          })}
        />
      </td>
    </tr>
  );
}
