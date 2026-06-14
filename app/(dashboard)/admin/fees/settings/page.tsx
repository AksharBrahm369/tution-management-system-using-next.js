import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

export default async function AdminFeeSettingsPage() {
  const [structures, batchesWithoutStructure, activeBatches, currentYear, standards] = await Promise.all([
    prisma.feeStructure.findMany({
      include: {
        batch: {
          select: {
            name: true,
            code: true,
            fees: true,
            standard: { select: { name: true } },
          },
        },
        _count: { select: { feeRecords: true } },
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 80,
    }),
    prisma.batch.count({ where: { status: "ACTIVE", feeStructures: { none: {} } } }),
    prisma.batch.count({ where: { status: "ACTIVE" } }),
    prisma.academicYear.findFirst({ where: { isCurrent: true }, select: { name: true, startDate: true, endDate: true } }),
    prisma.standard.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: { select: { students: true, batches: true } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  const activeStructures = structures.filter((structure) => structure.isActive).length;
  const configuredBatches = new Set(structures.map((structure) => structure.batchId).filter(Boolean)).size;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fee Settings</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Billing Setup</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review live fee structures, active batches, and standards before generating monthly fees.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/fees/collect" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">Collect fee</Link>
            <Link href="/admin/fees/records" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">Records</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active structures" value={activeStructures.toLocaleString("en-IN")} detail={`${structures.length} total structures`} />
        <Metric label="Configured batches" value={configuredBatches.toLocaleString("en-IN")} detail={`${activeBatches} active batches`} />
        <Metric label="Missing setup" value={batchesWithoutStructure.toLocaleString("en-IN")} detail="Active batches without structure" tone={batchesWithoutStructure > 0 ? "warn" : "good"} />
        <Metric label="Academic year" value={currentYear?.name ?? "Not set"} detail={currentYear ? "Current year configured" : "Set current year in settings"} tone={currentYear ? "good" : "warn"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-sm ring-1 ring-white/10">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Fee Structures</h2>
            <p className="mt-1 text-xs text-slate-500">Use this to confirm which batches are ready for monthly billing.</p>
          </div>

          {structures.length > 0 ? (
            <div className="divide-y divide-white/10">
              {structures.map((structure) => (
                <div key={structure.id} className="grid gap-4 px-5 py-4 text-sm text-slate-300 lg:grid-cols-[minmax(0,1.4fr)_140px_130px_120px] lg:items-center">
                  <div>
                    <p className="font-semibold text-white">{structure.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {structure.batch?.standard?.name ?? "General"} · {structure.batch?.name ?? "No batch mapped"} · {structure.academicYear}
                    </p>
                  </div>
                  <p className="font-semibold text-white">{money(structure.totalFee)}</p>
                  <p className="text-xs text-slate-500">{structure._count.feeRecords} records</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${structure.isActive ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" : "bg-slate-700/60 text-slate-200 ring-white/10"}`}>
                    {structure.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
                <h3 className="text-base font-semibold text-white">No fee structures configured.</h3>
                <p className="mt-2 text-sm text-slate-400">Batches can still use their batch fee for ad-hoc collection, but monthly billing needs structures.</p>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Standard readiness</p>
          <div className="mt-4 divide-y divide-white/10">
            {standards.map((standard) => (
              <div key={standard.name} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-white">{standard.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{standard._count.students} students</p>
                </div>
                <span className="text-xs font-semibold text-slate-300">{standard._count.batches} batches</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "warn" }) {
  const toneClass = {
    neutral: "text-slate-300",
    good: "text-emerald-300",
    warn: "text-amber-200",
  }[tone];

  return (
    <div className="rounded-2xl bg-slate-900/80 p-4 shadow-sm ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
