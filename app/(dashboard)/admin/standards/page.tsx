import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CalendarDays, GraduationCap, IndianRupee, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveStandards } from "@/lib/standards";

async function getStandardStats() {
  const standards = await getActiveStandards();
  const now = new Date();

  return Promise.all(
    standards.map(async (standard) => {
      const [students, teachers, batches, exams, fees] = await Promise.all([
        prisma.student.count({
          where: {
            OR: [
              { standardId: standard.id },
              { batchEnrollments: { some: { isActive: true, batch: { standardId: standard.id } } } },
            ],
          },
        }),
        prisma.teacher.count({
          where: {
            OR: [
              { standardSubjects: { some: { standardId: standard.id } } },
              { batches: { some: { standardId: standard.id } } },
            ],
          },
        }),
        prisma.batch.count({ where: { standardId: standard.id, status: { in: ["ACTIVE", "UPCOMING"] } } }),
        prisma.exam.count({
          where: {
            OR: [{ standardId: standard.id }, { batch: { standardId: standard.id } }],
            examDate: { gte: now },
            status: { in: ["UPCOMING", "ONGOING"] },
          },
        }),
        prisma.feeRecord.aggregate({
          where: {
            pendingAmount: { gt: 0 },
            OR: [{ student: { standardId: standard.id } }, { batch: { standardId: standard.id } }],
          },
          _sum: { pendingAmount: true },
        }),
      ]);

      return { ...standard, students, teachers, batches, exams, pendingFees: fees._sum.pendingAmount ?? 0 };
    })
  );
}

export default async function StandardsPage() {
  const standards = await getStandardStats();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-linear-to-br from-white to-cyan-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900/70 dark:to-slate-950">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Standards</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Manage 5th to 12th standard-wise</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Open one standard to work with its students, teachers, batches, attendance, exams, fees, materials, and reports.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {standards.map((standard) => (
          <Link
            key={standard.id}
            href={`/admin/standards/${standard.id}`}
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/70"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">Standard {standard.order}</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{standard.name}</h2>
              </div>
              <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Stat icon={<Users className="h-4 w-4" />} label="Students" value={standard.students} />
              <Stat icon={<GraduationCap className="h-4 w-4" />} label="Teachers" value={standard.teachers} />
              <Stat icon={<BookOpen className="h-4 w-4" />} label="Batches" value={standard.batches} />
              <Stat icon={<CalendarDays className="h-4 w-4" />} label="Exams" value={standard.exams} />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
              <IndianRupee className="h-4 w-4" />
              Pending fees: ₹{standard.pendingFees.toLocaleString("en-IN")}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/50">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">{icon}<span>{label}</span></div>
      <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
