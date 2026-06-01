'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';
import StatsCard from './StatsCard';
import { useAdminStats } from '@/hooks/useAdminStats';

const StatsGrid: React.FC = () => {
  const router = useRouter();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-3"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        label="Total Teachers"
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
        value={`₹ ${(stats.feeCollected || stats.monthlyCollection)
          .toLocaleString('en-IN')}`}
        icon={<IndianRupee />}
        color="green"
        change={8}
        changeLabel="vs last month"
        onClick={() => router.push('/admin/fees')}
      />

      <StatsCard
        label="Pending Fees"
        value={`₹ ${(stats.pendingFees ?? 0).toLocaleString('en-IN')}`}
        icon={<AlertCircle />}
        color="red"
        changeLabel="outstanding amount"
        onClick={() => router.push('/admin/fees')}
      />
    </div>
  );
};

export default StatsGrid;
