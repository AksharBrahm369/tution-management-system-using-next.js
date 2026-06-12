'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  IndianRupee,
  Users,
  TrendingUp,
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Skeleton } from '@/components/ui/skeleton';

const StatsGrid: React.FC = () => {
  const router = useRouter();
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        Could not load dashboard stats. Please refresh or sign in again.
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Left Side: Large Featured Card Skeleton (40% / 2 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="mb-4 h-10 w-24" />
          <Skeleton className="mb-3 h-8 w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        {/* Right Side: 2x2 grid of small cards skeleton (60% / 3 cols) */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="mb-2 h-7 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate some insights
  const studentGrowthPercent = stats.totalStudents > 0
    ? Math.round((stats.monthlyJoinedStudents / (stats.totalStudents - stats.monthlyJoinedStudents || 1)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* 1. Large Featured Card (40% -> lg:col-span-2) */}
      <section
        role="button"
        tabIndex={0}
        onClick={() => router.push('/admin/students')}
        onKeyDown={(event) => event.key === 'Enter' && router.push('/admin/students')}
        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer lg:col-span-2"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Student Body
            </span>
            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Active
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.totalStudents}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={16} />
              +{studentGrowthPercent}% this month
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Registration Trend</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                +{stats.monthlyJoinedStudents} enrolled in past 30 days
              </p>
            </div>
            {/* Clean minimalist trend line */}
            <div className="opacity-80 transition-opacity group-hover:opacity-100">
              <svg className="h-6 w-20 text-emerald-500" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 0 25 Q 15 24 30 18 T 60 15 T 85 8 T 100 2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Side Metrics Grid (60% -> lg:col-span-3) */}
      <div className="grid grid-cols-2 gap-4 lg:col-span-3">
        {/* Active Teachers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push('/admin/teachers')}
          onKeyDown={(event) => event.key === 'Enter' && router.push('/admin/teachers')}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Teachers</span>
            <GraduationCap size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {stats.totalTeachers}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Across all active batches</p>
        </div>

        {/* Active Batches */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push('/admin/batches')}
          onKeyDown={(event) => event.key === 'Enter' && router.push('/admin/batches')}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Batches</span>
            <BookOpen size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {stats.activeBatches}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Active study tracks</p>
        </div>

        {/* Attendance */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Attendance</span>
            <CheckCircle size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {stats.todayAttendance ?? 0}%
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Average checked today</p>
        </div>

        {/* Fee Collection */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => router.push('/admin/fees')}
          onKeyDown={(event) => event.key === 'Enter' && router.push('/admin/fees')}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Fee Collected</span>
            <IndianRupee size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            ₹{stats.feeCollected?.toLocaleString('en-IN') ?? stats.monthlyCollection?.toLocaleString('en-IN') ?? 0}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Total received in records</p>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
