export default function ImprovedStudents({ rows }: { rows: Array<{ name: string; previous: number; current: number; change: number }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Most Improved</h3>
      <div className="mt-2 space-y-2 text-sm">
        {rows.map((row) => (
          <p key={row.name}>{row.name}: {row.previous.toFixed(2)}% → {row.current.toFixed(2)}% ({row.change >= 0 ? "+" : ""}{row.change.toFixed(2)}%)</p>
        ))}
      </div>
    </div>
  );
}
