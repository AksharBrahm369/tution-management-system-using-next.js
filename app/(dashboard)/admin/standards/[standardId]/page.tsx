import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, BookMarked, BookOpen, CheckCircle, FileText, GraduationCap, IndianRupee, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

const modules = [
  { label: "Overview", href: "", icon: BarChart3 },
  { label: "Students", href: "students", icon: Users },
  { label: "Teachers", href: "teachers", icon: GraduationCap },
  { label: "Batches", href: "batches", icon: BookOpen },
  { label: "Attendance", href: "attendance", icon: CheckCircle },
  { label: "Exams", href: "exams", icon: FileText },
  { label: "Fees", href: "fees", icon: IndianRupee },
  { label: "Study Material", href: "materials", icon: BookMarked },
  { label: "Reports", href: "reports", icon: BarChart3 },
];

export default async function StandardDashboardPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  const [students, teachers, batches, exams, pendingFees] = await Promise.all([
    prisma.student.count({ where: { standardId } }),
    prisma.teacher.count({ where: { OR: [{ standardSubjects: { some: { standardId } } }, { batches: { some: { standardId } } }] } }),
    prisma.batch.count({ where: { standardId } }),
    prisma.exam.count({ where: { OR: [{ standardId }, { batch: { standardId } }] } }),
    prisma.feeRecord.aggregate({ where: { pendingAmount: { gt: 0 }, OR: [{ student: { standardId } }, { batch: { standardId } }] }, _sum: { pendingAmount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-sm dark:border-slate-800">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Standard Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">{standard.name}</h1>
        <p className="mt-2 text-sm text-slate-300">Everything below is scoped to this standard.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Metric label="Students" value={students} />
        <Metric label="Teachers" value={teachers} />
        <Metric label="Batches" value={batches} />
        <Metric label="Exams" value={exams} />
        <Metric label="Pending Fees" value={`₹${(pendingFees._sum.pendingAmount ?? 0).toLocaleString("en-IN")}`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.label}
              href={`/admin/standards/${standardId}${module.href ? `/${module.href}` : ""}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <Icon className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{module.label}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open {module.label.toLowerCase()} for {standard.name}.</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
