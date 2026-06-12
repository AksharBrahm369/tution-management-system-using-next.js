import React, { Suspense } from 'react';
import { getCurrentAdminUser } from '@/lib/adminAuth';
import WelcomeHeader from '@/components/admin/dashboard/WelcomeHeader';
import StatsGrid from '@/components/admin/dashboard/StatsGrid';
import FeeBarChart from '@/components/admin/dashboard/FeeBarChart';
import AttendanceDonutChart from '@/components/admin/dashboard/AttendanceDonutChart';
import TodaysClasses from '@/components/admin/dashboard/TodaysClasses';
import RecentPayments from '@/components/admin/dashboard/RecentPayments';
import AlertsPanel from '@/components/admin/dashboard/AlertsPanel';
import RecentStudents from '@/components/admin/dashboard/RecentStudents';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import FollowUpReminderWidget from '@/components/admin/enquiries/FollowUpReminderWidget';
import TodayAttendanceStatus from '@/components/admin/dashboard/TodayAttendanceStatus';
import FinancialHealth from '@/components/admin/dashboard/FinancialHealth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const user = await getCurrentAdminUser();

  return (
    <div className="w-full space-y-5">
      {/* SECTION 1: Command Header */}
      <WelcomeHeader adminName={user?.name ?? 'Admin'} />

      {/* STORY 1: "How many students?" & "Institute Snapshot" (SECTION 2) */}
      <Suspense fallback={<div className="text-slate-500">Loading snapshot...</div>}>
        <StatsGrid />
      </Suspense>

      {/* STORY 2: "What happened today?" (SECTION 3: Today's Operations) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Today&apos;s Operations Workspace
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 divide-y divide-slate-100 lg:grid-cols-3 lg:divide-y-0 lg:divide-x dark:divide-slate-800">
          {/* Today's Classes */}
          <div className="lg:pr-5 min-w-0">
            <TodaysClasses />
          </div>
          {/* Today's Attendance Status */}
          <div className="pt-4 lg:pt-0 lg:px-5 min-w-0">
            <TodayAttendanceStatus />
          </div>
          {/* Recent Collections */}
          <div className="pt-4 lg:pt-0 lg:pl-5 min-w-0">
            <RecentPayments />
          </div>
        </div>
      </section>

      {/* STORY 3 & 4: "Is attendance healthy?" & "Is revenue healthy?" (SECTION 4: Analytics & SECTION 6: Financial Health) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Attendance Analytics */}
        <div className="min-w-0">
          <AttendanceDonutChart />
        </div>
        {/* Fee Bar Chart */}
        <div className="min-w-0">
          <FeeBarChart />
        </div>
        {/* Financial Health Widget */}
        <div className="min-w-0">
          <FinancialHealth />
        </div>
      </div>

      {/* STORY 5: "What requires action?" (SECTION 5: Action Center & reminders) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Command Center Quick Actions */}
        <div className="min-w-0 lg:col-span-2">
          <QuickActions />
        </div>
        {/* Follow Up Reminders */}
        <div className="min-w-0">
          <FollowUpReminderWidget />
        </div>
      </div>

      {/* Recent Activity Timeline (SECTION 7) & Recent Registrations Table (SECTION 8) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Student Registrations Table */}
        <div className="min-w-0 lg:col-span-2">
          <RecentStudents />
        </div>
        {/* Activity Timeline / Alerts Feed */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
