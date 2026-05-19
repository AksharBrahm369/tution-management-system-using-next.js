import { ExamResult } from "../types";

export default function StudentResultModal({ result, onClose }: { result: ExamResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Student Result</h3>
        <p className="mt-2 text-sm">{result.student.firstName} {result.student.lastName} ({result.student.studentCode})</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <p>Marks: {result.marksObtained ?? "AB"}/{result.totalMarks}</p>
          <p>Percentage: {result.percentage ?? "-"}%</p>
          <p>Grade: {result.grade ?? "-"}</p>
          <p>Rank: {result.batchRank ?? "-"}</p>
          <p className="col-span-2">Remarks: {result.teacherRemarks ?? "-"}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
