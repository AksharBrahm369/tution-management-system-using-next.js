export default function BatchComparisonChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-xl border p-4 dark:border-slate-700">
      <h3 className="font-medium">Batch Comparison</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {data.map((item) => (
          <li key={item.label} className="flex items-center justify-between">
            <span>{item.label}</span>
            <span className="font-medium">{item.value.toFixed(2)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
