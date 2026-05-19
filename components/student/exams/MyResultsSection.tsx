type ResultRow = {
  examId: string;
  title: string;
  date: string;
  marksObtained: number | null;
  totalMarks: number;
  percentage: number | null;
  grade: string | null;
  rank: number | null;
};

export default function MyResultsSection({ rows }: { rows: ResultRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">My Results</h2>
      <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-3 py-2 text-left">Exam</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Marks</th>
              <th className="px-3 py-2 text-left">%</th>
              <th className="px-3 py-2 text-left">Grade</th>
              <th className="px-3 py-2 text-left">Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.examId} className="border-t dark:border-slate-700">
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{new Date(row.date).toLocaleDateString()}</td>
                <td className="px-3 py-2">{row.marksObtained ?? "AB"}/{row.totalMarks}</td>
                <td className="px-3 py-2">{row.percentage ?? "-"}</td>
                <td className="px-3 py-2">{row.grade ?? "-"}</td>
                <td className="px-3 py-2">{row.rank ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
