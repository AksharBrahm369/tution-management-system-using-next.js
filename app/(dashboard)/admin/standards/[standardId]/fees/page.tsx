import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function feePeriod(month: number, year: number) {
  return `${monthNames[month - 1] ?? "Month"} ${year}`;
}

function formatDate(date: Date | null) {
  if (!date) return "Not paid";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20";
    case "PARTIAL":
      return "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20";
    case "OVERDUE":
      return "bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20";
    case "WAIVED":
      return "bg-sky-500/10 text-sky-200 ring-1 ring-sky-400/20";
    default:
      return "bg-slate-700/60 text-slate-200 ring-1 ring-white/10";
  }
}

export default async function StandardFeesPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  const feeWhere: Prisma.FeeRecordWhereInput = {
    OR: [{ student: { standardId } }, { batch: { standardId } }],
  };

  const [records, aggregate, recordCount, studentCount, batchCount, pendingCount, overdueCount] = await Promise.all([
    prisma.feeRecord.findMany({
      where: feeWhere,
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true, status: true } },
        batch: { select: { name: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { amount: true, paymentMode: true, paidAt: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      take: 80,
    }),
    prisma.feeRecord.aggregate({
      where: feeWhere,
      _sum: { pendingAmount: true, paidAmount: true, totalAmount: true },
    }),
    prisma.feeRecord.count({ where: feeWhere }),
    prisma.student.count({ where: { standardId } }),
    prisma.batch.count({ where: { standardId } }),
    prisma.feeRecord.count({ where: { ...feeWhere, pendingAmount: { gt: 0 } } }),
    prisma.feeRecord.count({ where: { ...feeWhere, status: "OVERDUE" } }),
  ]);

  const totalAmount = aggregate._sum.totalAmount ?? 0;
  const paidAmount = aggregate._sum.paidAmount ?? 0;
  const pendingAmount = aggregate._sum.pendingAmount ?? 0;
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const visibleRecordNote = recordCount > records.length ? `Showing latest ${records.length} of ${recordCount}` : `${recordCount} records`;
  const hasRecords = records.length > 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Standard Fees</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{standard.name} Collection Desk</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Review billed, collected, and pending fees for this standard using live fee records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/fees/collect" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              Collect fee
            </Link>
            <Link href="/admin/fees/records" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
              All records
            </Link>
            <Link href="/admin/fees/reports" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
              Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total billed" value={money(totalAmount)} detail={`${recordCount} fee records`} />
        <MetricCard label="Collected" value={money(paidAmount)} detail={`${collectionRate}% collection rate`} tone="good" />
        <MetricCard label="Pending" value={money(pendingAmount)} detail={`${pendingCount} records need action`} tone={pendingAmount > 0 ? "warn" : "good"} />
        <MetricCard label="Overdue" value={overdueCount.toLocaleString("en-IN")} detail={`${studentCount} students, ${batchCount} batches`} tone={overdueCount > 0 ? "bad" : "neutral"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-sm ring-1 ring-white/10">
          <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Fee Ledger</h2>
              <p className="mt-1 text-xs text-slate-400">{visibleRecordNote}</p>
            </div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${pendingAmount > 0 ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20" : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20"}`}>
              {pendingAmount > 0 ? "Collection attention" : "Fees clear"}
            </span>
          </div>

          {hasRecords ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-slate-950/40 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 text-right font-semibold">Billed</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Pending</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Last payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {records.map((record) => {
                    const latestPayment = record.payments[0];
                    return (
                      <tr key={record.id} className="text-slate-300 transition hover:bg-white/[0.03]">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">
                            {record.student.firstName} {record.student.lastName}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">{record.student.studentCode} · {record.student.status}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{record.batch.name}</td>
                        <td className="px-4 py-4 text-slate-300">{feePeriod(record.month, record.year)}</td>
                        <td className="px-4 py-4 text-right font-medium text-slate-100">{money(record.totalAmount)}</td>
                        <td className="px-4 py-4 text-right text-emerald-300">{money(record.paidAmount)}</td>
                        <td className="px-4 py-4 text-right font-semibold text-white">{money(record.pendingAmount)}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(record.status)}`}>{record.status}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-slate-300">{latestPayment ? money(latestPayment.amount) : "No payment"}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {latestPayment ? `${latestPayment.paymentMode} · ${formatDate(latestPayment.paidAt)}` : `Due ${formatDate(record.dueDate)}`}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
                <h3 className="text-base font-semibold text-white">No fee records generated for this standard yet.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  This page is connected to live records. There are currently {studentCount} students and {batchCount} batches in {standard.name}, but no fee ledger entries match this standard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/admin/fees/collect" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                    Record a payment
                  </Link>
                  <Link href="/admin/fees/settings" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
                    Fee settings
                  </Link>
                  <Link href={`/admin/standards/${standardId}/students`} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
                    Review students
                  </Link>
                </div>
              </div>
              <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Readiness</p>
                <div className="mt-4 space-y-4">
                  <ReadinessRow label="Students mapped" value={studentCount} />
                  <ReadinessRow label="Batches mapped" value={batchCount} />
                  <ReadinessRow label="Fee records" value={recordCount} />
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Owner decision</p>
            <h2 className="mt-3 text-lg font-semibold text-white">
              {pendingAmount > 0 ? "Follow up on dues" : hasRecords ? "Collection is clean" : "Set up the fee ledger"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {pendingAmount > 0
                ? `${money(pendingAmount)} is pending across ${pendingCount} fee records. Prioritize overdue students first.`
                : hasRecords
                  ? "There is no pending fee pressure for this standard. Keep monitoring new monthly records."
                  : "Create or collect the first fee record so this standard starts appearing in collection reports."}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Finance links</p>
            <div className="mt-4 divide-y divide-white/10">
              <FinanceLink href="/admin/fees/defaulters" label="Defaulters" detail={`${overdueCount} overdue records`} />
              <FinanceLink href="/admin/fees/reports" label="Collection reports" detail={`${collectionRate}% collected`} />
              <FinanceLink href="/admin/fees/records" label="Fee records" detail={visibleRecordNote} />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const toneClass = {
    neutral: "text-slate-300",
    good: "text-emerald-300",
    warn: "text-amber-200",
    bad: "text-rose-200",
  }[tone];

  return (
    <div className="rounded-2xl bg-slate-900/80 p-4 shadow-sm ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function ReadinessRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value.toLocaleString("en-IN")}</span>
    </div>
  );
}

function FinanceLink({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 py-3 text-sm transition hover:text-white">
      <span className="font-semibold text-slate-200">{label}</span>
      <span className="text-right text-xs text-slate-500">{detail}</span>
    </Link>
  );
}
