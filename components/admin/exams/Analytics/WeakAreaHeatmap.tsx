export default function WeakAreaHeatmap({ rows }: { rows: Array<{ topic: string; score: number }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Weak Area Heatmap</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.topic}
            className="rounded p-2 text-xs"
            style={{ backgroundColor: `rgba(239, 68, 68, ${Math.max(0.15, 1 - row.score / 100)})` }}
          >
            {row.topic}: {row.score.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  );
}
