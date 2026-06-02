'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import AttendanceStatsCards from './AttendanceStatsCards';
import TodayBatchStatus from './TodayBatchStatus';
import AttendanceTrendChart from './AttendanceTrendChart';
import BatchComparisonChart from './BatchComparisonChart';
import RecentAttendanceTable from './RecentAttendanceTable';

export default function AttendanceOverviewPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: todayData, isLoading: loadingToday } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/admin/attendance/today');
      if (!res.ok) throw new Error('Failed to fetch today\'s attendance');
      return res.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/attendance/stats');
      if (!res.ok) throw new Error('Failed to fetch statistics');
      return res.json();
    },
  });

  const { data: recentData } = useQuery({
    queryKey: ['attendance', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/admin/attendance?limit=20');
      if (!res.ok) throw new Error('Failed to fetch recent attendance');
      return res.json();
    },
  });

  if (!mounted) return null;

  return (
    <div className="min-h-screen space-y-8 bg-slate-50 p-4 pb-8 text-slate-900 dark:bg-slate-950 dark:text-slate-50 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Attendance</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Track and manage student attendance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/attendance/reports">
              Export Report
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/attendance/mark">
              Mark Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {loadingToday ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 dark:text-slate-400" />
        </div>
      ) : (
        <>
          <AttendanceStatsCards 
            data={todayData?.data}
            isLoading={loadingToday}
          />

          {/* Today's Batch Status */}
          <TodayBatchStatus batchSummaries={todayData?.data?.batchSummaries || []} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AttendanceTrendChart data={statsData?.data?.weeklyTrend} />
            <BatchComparisonChart data={statsData?.data?.batchComparison} />
          </div>

          {/* Recent Activity Table */}
          <RecentAttendanceTable data={recentData?.data?.records || []} />
        </>
      )}
    </div>
  );
}
