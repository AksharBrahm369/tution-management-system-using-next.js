import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

export default async function MissingFeeRoutePage({ params }: { params: Promise<{ missing: string[] }> }) {
  const { missing } = await params;
  const [totals, pendingCount, studentsCount] = await Promise.all([
    prisma.feeRecord.aggregate({
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      _count: { _all: true },
    }),
    prisma.feeRecord.count({ where: { pendingAmount: { gt: 0 } } }),
    prisma.student.count({ where: { status: "ACTIVE" } }),
  ]);

  const attemptedPath = `/admin/fees/${missing.join("/")}`;
  const billed = totals._sum.totalAmount ?? 0;
  const collected = totals._sum.paidAmount ?? 0;
  const pending = totals._sum.pendingAmount ?? 0;
  const rate = billed > 0 ? Math.round((collected / billed) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fee Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Fee page moved or unavailable</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          The route <span className="font-semibold text-slate-200">{attemptedPath}</span> is not a current fee screen. Use the live fee tools below.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Billed" value={money(billed)} detail={`${totals._count._all} records`} />
        <Metric label="Collected" value={money(collected)} detail={`${rate}% collection rate`} tone="good" />
        <Metric label="Pending" value={money(pending)} detail={`${pendingCount} records need action`} tone={pending > 0 ? "warn" : "good"} />
        <Metric label="Active students" value={studentsCount.toLocaleString("en-IN")} detail="Available for collection" />
      </section>

      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <h2 className="text-sm font-semibold text-white">Open a working fee page</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <FeeLink href="/admin/fees" label="Fee management" detail="Monthly finance summary" />
          <FeeLink href="/admin/fees/collect" label="Collect fee" detail="Record payments and dues" />
          <FeeLink href="/admin/fees/records" label="Fee records" detail="Live student ledger" />
          <FeeLink href="/admin/fees/defaulters" label="Defaulters" detail="Pending follow-up queue" />
        </div>
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

function FeeLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="rounded-xl bg-slate-950/45 p-4 ring-1 ring-white/10 transition hover:bg-white/[0.04]">
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className="mt-1 block text-xs text-slate-500">{detail}</span>
    </Link>
  );
}
