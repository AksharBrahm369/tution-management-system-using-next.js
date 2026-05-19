export default function ExamTrendChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Exam Trend</h3>
      <div className="mt-2 space-y-1 text-sm">
        {rows.map((row) => (
          <p key={row.label}>{row.label}: {row.value.toFixed(2)}%</p>
        ))}
      </div>
    </div>
  );
}
