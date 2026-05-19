export default function WeakAreasCard({ strongAreas, weakAreas }: { strongAreas: string[]; weakAreas: string[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="font-medium text-emerald-600">Strong Areas</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {strongAreas.length ? strongAreas.map((area) => <span key={area} className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">{area}</span>) : <span className="text-sm text-slate-500">No data</span>}
        </div>
      </div>
      <div className="rounded-xl border p-4 dark:border-slate-700">
        <h3 className="font-medium text-red-600">Weak Areas</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {weakAreas.length ? weakAreas.map((area) => <span key={area} className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">{area}</span>) : <span className="text-sm text-slate-500">No data</span>}
        </div>
      </div>
    </section>
  );
}
