import type { Metadata } from "next";
import { Heart, Clock, User, BarChart3, Calendar, CheckCircle, Bell } from "lucide-react";

export const metadata: Metadata = { title: "Parent Dashboard" };

export default function ParentDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-600" />
          <h1 className="text-2xl font-bold text-slate-900">Parent Dashboard</h1>
        </div>
        <p className="text-sm text-slate-500">Monitor your child&apos;s academic progress and activities</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-500 to-rose-600 p-8 text-white shadow-lg shadow-rose-500/20">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-rose-200" />
          <div>
            <h2 className="text-xl font-bold">Parent Dashboard — Coming Soon</h2>
            <p className="mt-1 text-sm text-rose-100">
              Module 2 will include child progress monitoring, attendance alerts, fee receipts, and teacher communication.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { icon: User, label: "Linked Children", count: "—" },
          { icon: BarChart3, label: "Average Attendance", count: "—" },
          { icon: Calendar, label: "Upcoming Events", count: "—" },
        ].map(({ icon: Icon, label, count }) => (
          <div key={label} className="dashboard-card rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <Icon className="mb-4 h-6 w-6 text-rose-500" />
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Upcoming Features</h3>
        <div className="space-y-3">
          {["Child Progress Reports", "Attendance Notifications", "Fee Payment History", "Teacher Communication", "Event Announcements"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-rose-400" />
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
