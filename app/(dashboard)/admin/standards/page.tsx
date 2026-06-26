export const dynamic = "force-dynamic";

import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CalendarDays, GraduationCap, IndianRupee, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/shared/PageShell";
import { getActiveStandards } from "@/lib/standards";

async function getStandardStats() {
  const standards = await getActiveStandards();
  const standardIds = standards.map((standard) => standard.id);
  if (standardIds.length === 0) return [];

  const now = new Date();

  const [
    directStudents,
    batchEnrollments,
    teacherStandardSubjects,
    teacherBatches,
    batchCounts,
    exams,
    pendingFees,
  ] = await Promise.all([
    prisma.student.findMany({
      where: { standardId: { in: standardIds } },
      select: { id: true, standardId: true },
    }),
    prisma.batchEnrollment.findMany({
      where: { isActive: true, batch: { standardId: { in: standardIds } } },
      select: {
        studentId: true,
        batch: { select: { standardId: true } },
      },
    }),
    prisma.teacherStandardSubject.findMany({
      where: { standardId: { in: standardIds } },
      select: { standardId: true, teacherId: true },
    }),
    prisma.batch.findMany({
      where: { standardId: { in: standardIds } },
      select: { standardId: true, teacherId: true },
    }),
    prisma.batch.groupBy({
      by: ["standardId"],
      where: { standardId: { in: standardIds }, status: { in: ["ACTIVE", "UPCOMING"] } },
      _count: { _all: true },
    }),
    prisma.exam.findMany({
      where: {
        examDate: { gte: now },
        status: { in: ["UPCOMING", "ONGOING"] },
        OR: [{ standardId: { in: standardIds } }, { batch: { standardId: { in: standardIds } } }],
      },
      select: {
        id: true,
        standardId: true,
        batch: { select: { standardId: true } },
      },
    }),
    prisma.feeRecord.findMany({
      where: {
        pendingAmount: { gt: 0 },
        OR: [{ student: { standardId: { in: standardIds } } }, { batch: { standardId: { in: standardIds } } }],
      },
      select: {
        pendingAmount: true,
        student: { select: { standardId: true } },
        batch: { select: { standardId: true } },
      },
    }),
  ]);

  const studentSets = new Map(standardIds.map((id) => [id, new Set<string>()]));
  for (const student of directStudents) {
    if (student.standardId) studentSets.get(student.standardId)?.add(student.id);
  }
  for (const enrollment of batchEnrollments) {
    const standardId = enrollment.batch.standardId;
    if (standardId) studentSets.get(standardId)?.add(enrollment.studentId);
  }

  const teacherSets = new Map(standardIds.map((id) => [id, new Set<string>()]));
  for (const assignment of teacherStandardSubjects) {
    teacherSets.get(assignment.standardId)?.add(assignment.teacherId);
  }
  for (const batch of teacherBatches) {
    if (batch.standardId) teacherSets.get(batch.standardId)?.add(batch.teacherId);
  }

  const batchCountByStandard = new Map(
    batchCounts
      .filter((item) => item.standardId)
      .map((item) => [item.standardId!, item._count._all])
  );

  const examSets = new Map(standardIds.map((id) => [id, new Set<string>()]));
  for (const exam of exams) {
    const standardId = exam.standardId ?? exam.batch?.standardId;
    if (standardId) examSets.get(standardId)?.add(exam.id);
  }

  const pendingFeesByStandard = new Map(standardIds.map((id) => [id, 0]));
  for (const fee of pendingFees) {
    const standardId = fee.student?.standardId ?? fee.batch.standardId;
    if (!standardId) continue;
    pendingFeesByStandard.set(
      standardId,
      (pendingFeesByStandard.get(standardId) ?? 0) + fee.pendingAmount
    );
  }

  return standards.map((standard) => ({
    ...standard,
    students: studentSets.get(standard.id)?.size ?? 0,
    teachers: teacherSets.get(standard.id)?.size ?? 0,
    batches: batchCountByStandard.get(standard.id) ?? 0,
    exams: examSets.get(standard.id)?.size ?? 0,
    pendingFees: pendingFeesByStandard.get(standard.id) ?? 0,
  }));
}

export default async function StandardsPage() {
  const standards = await getStandardStats();

  return (
    <PageShell
      title="Standards"
      description="Manage students, teachers, batches, attendance, exams, fees, materials, and reports standard-wise."
    >
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
    </PageShell>
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
