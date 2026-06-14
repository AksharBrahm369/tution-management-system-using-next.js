import Link from "next/link";
import { prisma } from "@/lib/prisma";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function period(month: number, year: number) {
  return `${monthNames[month - 1] ?? "Month"} ${year}`;
}

function dateLabel(date: Date | null) {
  if (!date) return "Not paid";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusTone(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20";
  if (status === "PARTIAL") return "bg-amber-500/10 text-amber-200 ring-amber-400/20";
  if (status === "OVERDUE") return "bg-rose-500/10 text-rose-200 ring-rose-400/20";
  return "bg-slate-700/60 text-slate-200 ring-white/10";
}

export default async function AdminFeeRecordsPage() {
  const [records, totals, pendingCount, overdueCount] = await Promise.all([
    prisma.feeRecord.findMany({
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentCode: true,
            phone: true,
            standard: { select: { name: true } },
          },
        },
        batch: { select: { name: true, code: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { amount: true, paymentMode: true, paidAt: true },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      take: 120,
    }),
    prisma.feeRecord.aggregate({
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      _count: { _all: true },
    }),
    prisma.feeRecord.count({ where: { pendingAmount: { gt: 0 } } }),
    prisma.feeRecord.count({ where: { status: "OVERDUE" } }),
  ]);

  const totalAmount = totals._sum.totalAmount ?? 0;
  const paidAmount = totals._sum.paidAmount ?? 0;
  const pendingAmount = totals._sum.pendingAmount ?? 0;
  const collectionRate = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fee Records</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Student Fee Ledger</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Live ledger of billed, collected, and pending fee records across all batches.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/fees/collect" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">Collect fee</Link>
            <Link href="/admin/fees/defaulters" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">Defaulters</Link>
            <Link href="/admin/fees/reports" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">Reports</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Billed" value={money(totalAmount)} detail={`${totals._count._all} fee records`} />
        <Metric label="Collected" value={money(paidAmount)} detail={`${collectionRate}% collection rate`} tone="good" />
        <Metric label="Pending" value={money(pendingAmount)} detail={`${pendingCount} records need action`} tone={pendingAmount > 0 ? "warn" : "good"} />
        <Metric label="Overdue" value={overdueCount.toLocaleString("en-IN")} detail="Priority follow-up list" tone={overdueCount > 0 ? "bad" : "neutral"} />
      </section>

      <section className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-sm ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Latest Records</h2>
            <p className="mt-1 text-xs text-slate-500">Showing latest {records.length} records.</p>
          </div>
        </div>

        {records.length > 0 ? (
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
                        <div className="font-semibold text-white">{record.student.firstName} {record.student.lastName}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.student.studentCode} · {record.student.standard?.name ?? "No standard"}</div>
                      </td>
                      <td className="px-4 py-4">{record.batch.name}</td>
                      <td className="px-4 py-4">{period(record.month, record.year)}</td>
                      <td className="px-4 py-4 text-right font-medium text-slate-100">{money(record.totalAmount)}</td>
                      <td className="px-4 py-4 text-right text-emerald-300">{money(record.paidAmount)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-white">{money(record.pendingAmount)}</td>
                      <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(record.status)}`}>{record.status}</span></td>
                      <td className="px-5 py-4">
                        <div>{latestPayment ? money(latestPayment.amount) : "No payment"}</div>
                        <div className="mt-1 text-xs text-slate-500">{latestPayment ? `${latestPayment.paymentMode} · ${dateLabel(latestPayment.paidAt)}` : `Due ${dateLabel(record.dueDate)}`}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
              <h3 className="text-base font-semibold text-white">No fee records yet.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Generate monthly fees or record a student payment to start the live ledger.
              </p>
            </div>
            <Link href="/admin/fees/collect" className="flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              Open collection desk
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
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
