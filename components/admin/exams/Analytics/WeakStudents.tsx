export default function WeakStudents({ rows }: { rows: Array<{ name: string; average: number; trend: string }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Needs Attention</h3>
      <div className="mt-2 space-y-2 text-sm">
        {rows.map((row) => (
          <p key={row.name}>{row.name}: {row.average.toFixed(2)}% ({row.trend})</p>
        ))}
      </div>
    </div>
  );
}
