import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

export default async function StandardReportsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  const [students, activeBatches, exams, materials] = await Promise.all([
    prisma.student.count({ where: { standardId } }),
    prisma.batch.count({ where: { standardId, status: "ACTIVE" } }),
    prisma.exam.count({ where: { OR: [{ standardId }, { batch: { standardId } }] } }),
    prisma.studyMaterial.count({ where: { OR: [{ standardId }, { batch: { standardId } }] } }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{standard.name} Reports</h1>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard label="Students" value={students} />
        <ReportCard label="Active Batches" value={activeBatches} />
        <ReportCard label="Exams" value={exams} />
        <ReportCard label="Materials" value={materials} />
      </section>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
