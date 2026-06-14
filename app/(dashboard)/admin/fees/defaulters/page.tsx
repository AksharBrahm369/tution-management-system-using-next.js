import Link from "next/link";
import { prisma } from "@/lib/prisma";

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function AdminFeeDefaultersPage() {
  const today = new Date();
  const [records, totals, overdueCount] = await Promise.all([
    prisma.feeRecord.findMany({
      where: { pendingAmount: { gt: 0 } },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true,
            phone: true,
            parent: { select: { fatherPhone: true, motherPhone: true, guardianPhone: true } },
            standard: { select: { name: true } },
          },
        },
        batch: { select: { name: true } },
        reminders: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, sentAt: true, createdAt: true } },
      },
      orderBy: [{ dueDate: "asc" }, { pendingAmount: "desc" }],
      take: 120,
    }),
    prisma.feeRecord.aggregate({
      where: { pendingAmount: { gt: 0 } },
      _sum: { pendingAmount: true, totalAmount: true, paidAmount: true },
      _count: { _all: true },
    }),
    prisma.feeRecord.count({ where: { status: "OVERDUE" } }),
  ]);

  const pendingAmount = totals._sum.pendingAmount ?? 0;
  const overdueAmount = records.filter((record) => record.dueDate < today || record.status === "OVERDUE").reduce((sum, record) => sum + record.pendingAmount, 0);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fee Follow-Ups</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Defaulters & Pending Dues</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Live list of students with pending fees, sorted by due date and collection pressure.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/fees/collect" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">Collect fee</Link>
            <Link href="/admin/fees/records" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">Records</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pending dues" value={money(pendingAmount)} detail={`${totals._count._all} open records`} tone={pendingAmount > 0 ? "warn" : "good"} />
        <Metric label="Overdue amount" value={money(overdueAmount)} detail={`${overdueCount} overdue records`} tone={overdueAmount > 0 ? "bad" : "good"} />
        <Metric label="Students to call" value={new Set(records.map((record) => record.student.id)).size.toLocaleString("en-IN")} detail="Unique students with dues" />
        <Metric label="Oldest due" value={records[0] ? dateLabel(records[0].dueDate) : "Clear"} detail="First follow-up priority" />
      </section>

      <section className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-sm ring-1 ring-white/10">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Collection Queue</h2>
          <p className="mt-1 text-xs text-slate-500">Call the oldest dues first, then partial payments with high balances.</p>
        </div>

        {records.length > 0 ? (
          <div className="divide-y divide-white/10">
            {records.map((record) => {
              const contact = record.student.phone ?? record.student.parent?.fatherPhone ?? record.student.parent?.motherPhone ?? record.student.parent?.guardianPhone ?? "No phone";
              const reminder = record.reminders[0];
              const overdue = record.dueDate < today || record.status === "OVERDUE";
              return (
                <div key={record.id} className="grid gap-4 px-5 py-4 text-sm text-slate-300 lg:grid-cols-[minmax(0,1.4fr)_1fr_150px_150px_140px] lg:items-center">
                  <div>
                    <p className="font-semibold text-white">{record.student.firstName} {record.student.lastName}</p>
                    <p className="mt-1 text-xs text-slate-500">{record.student.studentCode} · {record.student.standard?.name ?? "No standard"} · {contact}</p>
                  </div>
                  <div>
                    <p className="text-slate-200">{record.batch.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Due {dateLabel(record.dueDate)}</p>
                  </div>
                  <p className="font-semibold text-white">{money(record.pendingAmount)}</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${overdue ? "bg-rose-500/10 text-rose-200 ring-rose-400/20" : "bg-amber-500/10 text-amber-200 ring-amber-400/20"}`}>
                    {overdue ? "Overdue" : record.status}
                  </span>
                  <p className="text-xs text-slate-500">{reminder ? `Reminder ${reminder.status}` : "No reminder yet"}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5">
            <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
              <h3 className="text-base font-semibold text-white">No pending dues.</h3>
              <p className="mt-2 text-sm text-slate-400">There are no students requiring fee follow-up right now.</p>
            </div>
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
