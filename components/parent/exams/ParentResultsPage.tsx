export default function ParentResultsPage({
  rows,
}: {
  rows: Array<{ examTitle: string; studentName: string; marks: string; percentage: number | null; grade: string | null }>;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Child Results</h1>
      <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">Exam</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2 text-left">Marks</th>
              <th className="px-3 py-2 text-left">%</th>
              <th className="px-3 py-2 text-left">Grade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.examTitle}-${index}`} className="border-t dark:border-slate-700">
                <td className="px-3 py-2">{row.examTitle}</td>
                <td className="px-3 py-2">{row.studentName}</td>
                <td className="px-3 py-2">{row.marks}</td>
                <td className="px-3 py-2">{row.percentage ?? "-"}</td>
                <td className="px-3 py-2">{row.grade ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
