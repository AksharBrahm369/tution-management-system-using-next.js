export const dynamic = "force-dynamic";

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
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">Standards</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Manage students, teachers, batches, attendance, exams, fees, materials, and reports standard-wise.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {standards.map((standard) => (
          <Link
            key={standard.id}
            href={`/admin/standards/${standard.id}`}
            className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Standard {standard.order}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{standard.name}</h2>
              </div>
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Stat icon={<Users className="h-4 w-4" />} label="Students" value={standard.students} />
              <Stat icon={<GraduationCap className="h-4 w-4" />} label="Teachers" value={standard.teachers} />
              <Stat icon={<BookOpen className="h-4 w-4" />} label="Batches" value={standard.batches} />
              <Stat icon={<CalendarDays className="h-4 w-4" />} label="Exams" value={standard.exams} />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
              <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              <span>Pending fees: Rs. {standard.pendingFees.toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Students</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Batches</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">Reports</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
