import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

export default async function StandardFeesPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  const [records, aggregate] = await Promise.all([
    prisma.feeRecord.findMany({
      where: { OR: [{ student: { standardId } }, { batch: { standardId } }] },
      include: { student: { select: { firstName: true, lastName: true, studentCode: true } }, batch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.feeRecord.aggregate({
      where: { pendingAmount: { gt: 0 }, OR: [{ student: { standardId } }, { batch: { standardId } }] },
      _sum: { pendingAmount: true, paidAmount: true, totalAmount: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Fees</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{standard.name} Fees</h1>
        <p className="mt-2 text-sm text-slate-500">Pending: ₹{(aggregate._sum.pendingAmount ?? 0).toLocaleString("en-IN")}</p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="flex flex-col rounded-2xl border border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">{record.student.firstName} {record.student.lastName}</p>
                <p className="text-sm text-slate-500">{record.student.studentCode} · {record.batch.name}</p>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending ₹{record.pendingAmount.toLocaleString("en-IN")}</p>
            </div>
          ))}
          {!records.length && <p className="text-sm text-slate-500">No fee records found for this standard.</p>}
        </div>
      </section>
    </div>
  );
}
