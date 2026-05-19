export default function NavigationGrid({
  count,
  current,
  answered,
  onJump,
}: {
  count: number;
  current: number;
  answered: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: count }).map((_, index) => {
        const active = index === current;
        const done = answered.has(index);
        return (
          <button
            key={index}
            className={`rounded px-2 py-1 text-sm ${active ? "bg-blue-600 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 dark:bg-slate-800"}`}
            onClick={() => onJump(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
