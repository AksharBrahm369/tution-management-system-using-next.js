export default function PerformanceChart({ points }: { points: Array<{ label: string; value: number }> }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Performance Trend</h2>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <div className="space-y-2 text-sm">
          {points.map((point) => (
            <p key={point.label}>{point.label}: {point.value.toFixed(2)}%</p>
          ))}
        </div>
      </div>
    </section>
  );
}
