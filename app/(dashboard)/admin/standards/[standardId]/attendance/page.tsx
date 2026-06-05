import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

export default async function StandardAttendancePage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  const batches = await prisma.batch.findMany({
    where: { standardId },
    include: { enrollments: { where: { isActive: true }, select: { id: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Attendance</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{standard.name} Attendance</h1>
        <p className="mt-2 text-sm text-slate-500">Select a standard batch to mark or review attendance.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {batches.map((batch) => (
          <Link key={batch.id} href={`/admin/standards/${standardId}/attendance/mark?batch=${batch.id}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">{batch.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{batch.enrollments.length} active students</p>
          </Link>
        ))}
        {!batches.length && <p className="text-sm text-slate-500">No batches found for this standard.</p>}
      </section>
    </div>
  );
}
