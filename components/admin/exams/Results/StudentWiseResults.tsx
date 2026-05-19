import { ExamResult } from "../types";

export default function StudentWiseResults({ results }: { results: ExamResult[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-3 py-2 text-left">Student</th>
            <th className="px-3 py-2 text-left">Marks</th>
            <th className="px-3 py-2 text-left">%</th>
            <th className="px-3 py-2 text-left">Grade</th>
            <th className="px-3 py-2 text-left">Rank</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.id} className="border-t dark:border-slate-700">
              <td className="px-3 py-2">{result.student.firstName} {result.student.lastName}</td>
              <td className="px-3 py-2">{result.isAbsent ? "AB" : `${result.marksObtained}/${result.totalMarks}`}</td>
              <td className="px-3 py-2">{result.percentage ?? "-"}</td>
              <td className="px-3 py-2">{result.grade ?? "-"}</td>
              <td className="px-3 py-2">{result.batchRank ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
