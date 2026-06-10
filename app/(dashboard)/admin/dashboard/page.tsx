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

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function DashboardPage() {
  const user = await getCurrentAdminUser();

  return (
    <div className="w-full space-y-5">
      <WelcomeHeader adminName={user?.name ?? 'Admin'} />

      <Suspense fallback={<div className="text-slate-500">Loading stats...</div>}>
        <StatsGrid />
      </Suspense>

      <div className="w-full">
        <QuickActions />
      </div>

      <section className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <FeeBarChart />
        </div>
        <div className="min-w-0 xl:col-span-2">
          <AttendanceDonutChart />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
        <div className="min-w-0">
          <TodaysClasses />
        </div>
        <div className="min-w-0">
          <RecentPayments />
        </div>
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <AlertsPanel />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FollowUpReminderWidget />
      </section>

      <div className="w-full">
        <RecentStudents />
      </div>
    </div>
  );
}
