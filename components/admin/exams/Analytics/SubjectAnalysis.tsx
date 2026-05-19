export default function SubjectAnalysis({ rows }: { rows: Array<{ subject: string; average: number }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Subject Analysis</h3>
      <div className="mt-2 space-y-2 text-sm">
        {rows.map((row) => (
          <p key={row.subject}>{row.subject}: {row.average.toFixed(2)}%</p>
        ))}
      </div>
    </div>
  );
}
