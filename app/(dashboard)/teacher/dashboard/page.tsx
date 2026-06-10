import type { Metadata } from "next";
import { BookOpen, Calendar, CheckCircle, Clock, GraduationCap, Users } from "lucide-react";

export const metadata: Metadata = { title: "Teacher Dashboard" };

const summaryCards = [
  { icon: BookOpen, label: "My Batches", value: "-", tone: "blue" },
  { icon: Calendar, label: "Today's Classes", value: "-", tone: "emerald" },
  { icon: Users, label: "Students", value: "-", tone: "slate" },
  { icon: CheckCircle, label: "Pending Attendance", value: "-", tone: "amber" },
];

const toneClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
};

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">Teacher Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A focused workspace for classes, students, exams, and attendance.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-inset ${toneClasses[tone]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <h2 className="font-semibold text-slate-950 dark:text-white">Today&apos;s Classes</h2>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Class assignments will appear here after batches are linked to this teacher account.
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-950 dark:text-white">Available Workspace</h2>
          <div className="mt-4 space-y-3">
            {["My batches", "Students", "Upcoming exams", "Attendance follow-up"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
