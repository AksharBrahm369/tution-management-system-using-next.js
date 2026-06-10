'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  GraduationCap,
  IndianRupee,
  Users,
} from 'lucide-react';
import StatsCard from './StatsCard';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';

const StatsGrid: React.FC = () => {
  const router = useRouter();
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        Could not load dashboard stats. Please refresh or sign in again.
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-start justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="mb-3 h-8 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatsCard
        label="Total Students"
        value={stats.totalStudents}
        icon={<Users />}
        color="blue"
        change={12}
        changeLabel="joined this month"
        onClick={() => router.push('/admin/students')}
      />

      <StatsCard
        label="Active Teachers"
        icon={<GraduationCap />}
        value={stats.totalTeachers}
        color="purple"
        changeLabel="across all batches"
        onClick={() => router.push('/admin/teachers')}
      />

      <StatsCard
        label="Active Batches"
        value={stats.activeBatches ?? 0}
        icon={<BookOpen />}
        color="green"
        changeLabel="running this month"
        onClick={() => router.push('/admin/batches')}
      />

      <StatsCard
        label="Today's Attendance"
        value={`${stats.todayAttendance ?? 0}%`}
        icon={<CheckCircle />}
        color="orange"
        changeLabel="attendance percentage today"
      />

      <StatsCard
        label="Fee Collected"
        value={`Rs. ${(stats.feeCollected || stats.monthlyCollection).toLocaleString('en-IN')}`}
        icon={<IndianRupee />}
        color="green"
        change={8}
        changeLabel="vs last month"
        onClick={() => router.push('/admin/fees')}
      />

      <StatsCard
        label="Pending Fees"
        value={`Rs. ${(stats.pendingFees ?? 0).toLocaleString('en-IN')}`}
        icon={<AlertCircle />}
        color="red"
        changeLabel="outstanding amount"
        onClick={() => router.push('/admin/fees')}
      />
    </div>
  );
};

export default StatsGrid;
