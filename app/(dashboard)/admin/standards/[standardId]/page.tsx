export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BookMarked,
  BookOpen,
  CheckCircle,
  FileText,
  GraduationCap,
  IndianRupee,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";

const workspaceGroups = [
  {
    title: "Daily Operations",
    description: "Run the standard day to day.",
    items: [
      { label: "Students", href: "students", icon: Users, note: "Directory, profiles, admissions" },
      { label: "Attendance", href: "attendance", icon: CheckCircle, note: "Marking, reports, exceptions" },
      { label: "Batches", href: "batches", icon: BookOpen, note: "Timings, enrolments, schedules" },
    ],
  },
  {
    title: "Academic Control",
    description: "Track teaching, exams, and material.",
    items: [
      { label: "Overview", href: "overview", icon: BarChart3, note: "Performance and standard health" },
      { label: "Teachers", href: "teachers", icon: GraduationCap, note: "Faculty allocation" },
      { label: "Exams", href: "exams", icon: FileText, note: "Tests, marks, report cards" },
      { label: "Study Material", href: "materials", icon: BookMarked, note: "Notes, uploads, resources" },
    ],
  },
  {
    title: "Finance & Reporting",
    description: "Review dues and owner-level reports.",
    items: [
      { label: "Fees", href: "fees", icon: IndianRupee, note: "Collection, dues, records" },
      { label: "Reports", href: "reports", icon: BarChart3, note: "Exports and decision reports" },
    ],
  },
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

  const pendingFeeValue = pendingFees._sum.pendingAmount ?? 0;
  const studentsPerBatch = batches > 0 ? Math.round((students / batches) * 10) / 10 : 0;
  const teacherLoad = teachers > 0 ? Math.round((batches / teachers) * 10) / 10 : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Standard Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
              {standard.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Students, teachers, batches, exams, fees, and reports scoped to this standard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs sm:min-w-[360px]">
            <StatusCell label="Students" value={students} />
            <StatusCell label="Batches" value={batches} />
            <StatusCell label="Pending Fees" value={`Rs. ${pendingFeeValue.toLocaleString("en-IN")}`} tone={pendingFeeValue > 0 ? "amber" : "emerald"} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Standard Health</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Operational counts that define today&apos;s workload.</p>
            </div>
            <Link
              href={`/admin/standards/${standardId}/overview`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Open overview <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Students" value={students} detail={`${studentsPerBatch || 0} per active batch`} />
            <Metric label="Teachers" value={teachers} detail={`${teacherLoad || 0} batch load`} />
            <Metric label="Batches" value={batches} detail="Active study groups" />
            <Metric label="Exams" value={exams} detail="Scheduled and historical" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Owner Attention</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">What needs a decision first.</p>
            </div>
            <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
              pendingFeeValue > 0
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            }`}>
              {pendingFeeValue > 0 ? "Dues pending" : "Fees clear"}
            </span>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/40">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending collection</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
              Rs. {pendingFeeValue.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {pendingFeeValue > 0 ? "Open fee records before month-end follow-up." : "No pending fee pressure for this standard."}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/admin/standards/${standardId}/fees`}
              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Review fees
            </Link>
            <Link
              href={`/admin/standards/${standardId}/reports`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.25fr_0.9fr]">
        {workspaceGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{group.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
            </div>
            <div className="space-y-1.5">
              {group.items.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.label}
                    href={`/admin/standards/${standardId}/${module.href}`}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-950/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{module.label}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{module.note}</span>
                    </span>
                    <ArrowUpRight size={13} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950/40">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function StatusCell({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "slate" | "amber" | "emerald" }) {
  const toneClass = {
    slate: "text-slate-950 dark:text-white",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-950/40">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
