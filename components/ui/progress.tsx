export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full rounded bg-slate-200 dark:bg-slate-700 ${className}`}>
      <div className="h-2 rounded bg-blue-600" style={{ width: `${normalized}%` }} />
    </div>
  );
}
