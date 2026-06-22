"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, IndianRupee, Users, GraduationCap, CheckCircle2, FileBarChart2, ArrowRight } from "lucide-react";
import StatsCard from "@/components/admin/dashboard/StatsCard";
import FeeBarChart from "@/components/admin/dashboard/FeeBarChart";
import AttendanceDonutChart from "@/components/admin/dashboard/AttendanceDonutChart";
import RecentPayments from "@/components/admin/dashboard/RecentPayments";
import RecentStudents from "@/components/admin/dashboard/RecentStudents";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import { useAdminStats } from "@/hooks/useAdminStats";

const reportLinks = [
  { label: "Fee Reports", href: "/admin/fees/reports", description: "Collection, pending dues, and payment trends." },
  { label: "Exam Analytics", href: "/admin/exams/analytics", description: "Performance, toppers, and weak areas." },
  { label: "Attendance", href: "/admin/attendance", description: "Batch attendance and daily tracking." },
  { label: "Student Directory", href: "/admin/students", description: "Enrollment, status, and profile access." },
];

export default function ReportsDashboardPage() {
  const router = useRouter();
  const { data: stats } = useAdminStats();

  const keyMetrics = useMemo(() => {
    return [
      {
        label: "Students",
        value: stats?.totalStudents ?? 0,
        icon: <Users className="h-5 w-5" />,
        color: "blue" as const,
        changeLabel: "active enrollments",
        change: 12,
      },
      {
        label: "Teachers",
        value: stats?.totalTeachers ?? 0,
        icon: <GraduationCap className="h-5 w-5" />,
        color: "purple" as const,
        changeLabel: "faculty strength",
        change: 8,
      },
      {
        label: "Fee Collected",
        value: `₹ ${(stats?.feeCollected ?? 0).toLocaleString("en-IN")}`,
        icon: <IndianRupee className="h-5 w-5" />,
        color: "green" as const,
        changeLabel: "this month",
        change: 16,
      },
      {
        label: "Attendance",
        value: `${stats?.todayAttendance ?? 0}%`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        color: "orange" as const,
        changeLabel: "today",
        change: 4,
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Page-level heading – exactly one h1 on this page */}
      <header className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Reports</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Overview of key metrics, charts, and quick report links.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {keyMetrics.map((metric) => (
          <StatsCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            change={metric.change}
            changeLabel={metric.changeLabel}
            onClick={() =>
              router.push(
                metric.label === "Fee Collected"
                  ? "/admin/fees/reports"
                  : metric.label === "Attendance"
                  ? "/admin/attendance"
                  : "/admin/dashboard"
              )
            }
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Finance</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Collection Trends</h2>
            </div>
            <button
              onClick={() => router.push("/admin/fees/reports")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Open fee reports <ArrowRight size={16} />
            </button>
          </div>
          <FeeBarChart />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Academics</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Attendance Overview</h2>
            </div>
            <button
              onClick={() => router.push("/admin/attendance")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View attendance <ArrowRight size={16} />
            </button>
          </div>
          <AttendanceDonutChart />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Reporting Hub</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Quick Report Links</h2>
            </div>
            <FileBarChart2 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {reportLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/20"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</div>
                <div className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Operations</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Live Lists</h2>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            <RecentPayments />
            <RecentStudents />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Actions</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Common Admin Tasks</h2>
          </div>
        </div>
        <QuickActions />
      </section>
    </div>
  );
}
