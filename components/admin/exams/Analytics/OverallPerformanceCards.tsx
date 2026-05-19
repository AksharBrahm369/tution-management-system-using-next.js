export default function OverallPerformanceCards({
  instituteAverage,
  bestBatch,
  worstBatch,
  improvedStudent,
}: {
  instituteAverage: number;
  bestBatch: string;
  worstBatch: string;
  improvedStudent: string;
}) {
  const cards = [
    { title: "Institute Average", value: `${instituteAverage.toFixed(2)}%` },
    { title: "Best Performing Batch", value: bestBatch },
    { title: "Worst Performing Batch", value: worstBatch },
    { title: "Most Improved Student", value: improvedStudent },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="rounded-xl border p-4 dark:border-slate-700">
          <p className="text-sm text-slate-500">{card.title}</p>
          <p className="mt-1 text-lg font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
