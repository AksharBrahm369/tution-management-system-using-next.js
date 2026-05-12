import type { Metadata } from "next";
import { GraduationCap, BookOpen, Users, Clock, Calendar, CheckCircle } from "lucide-react";

export const metadata: Metadata = { title: "Teacher Dashboard" };

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">Manage your classes, students, and schedules</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white shadow-lg shadow-emerald-600/20">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-emerald-200" />
          <div>
            <h2 className="text-xl font-bold">Teacher Dashboard — Coming Soon</h2>
            <p className="mt-1 text-sm text-emerald-100">
              Module 2 will include class management, student lists, attendance marking, and lesson planning tools.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { icon: BookOpen, label: "My Classes", count: "—", color: "emerald" },
          { icon: Users, label: "My Students", count: "—", color: "blue" },
          { icon: Calendar, label: "Today's Schedule", count: "—", color: "violet" },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="dashboard-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-100`}>
              <Icon className={`h-5 w-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Upcoming Features</h3>
        <div className="space-y-3">
          {["Class Management", "Attendance Marking", "Assignment Creation", "Student Progress Tracking", "Lesson Planning"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
