import type { Metadata } from "next";
import { BookOpen, Clock, Trophy, Calendar, CheckCircle, BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Student Dashboard" };

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">View your classes, assignments, and progress</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-600 to-violet-700 p-8 text-white shadow-lg shadow-violet-600/20">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-violet-200" />
          <div>
            <h2 className="text-xl font-bold">Student Dashboard — Coming Soon</h2>
            <p className="mt-1 text-sm text-violet-100">
              Module 2 will include class timetable, assignments, attendance history, and fee payment status.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { icon: BookOpen, label: "Enrolled Classes", count: "—", color: "violet" },
          { icon: Trophy, label: "Assignments Due", count: "—", color: "amber" },
          { icon: BarChart3, label: "Attendance Rate", count: "—", color: "emerald" },
        ].map(({ icon: Icon, label, count }) => (
          <div key={label} className="dashboard-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <Icon className="mb-4 h-6 w-6 text-violet-600" />
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Upcoming Features</h3>
        <div className="space-y-3">
          {["Class Timetable", "Assignment Submissions", "Attendance History", "Fee Payment Status", "Performance Reports"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-violet-400" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
