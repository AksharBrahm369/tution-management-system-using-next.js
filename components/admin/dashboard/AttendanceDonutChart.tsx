'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  attendanceOverview: {
    present: number;
    absent: number;
    late: number;
  };
}

const AttendanceDonutChart: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError } = useQuery<ChartData>({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (!mounted || isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-5 h-5 w-44" />
        <Skeleton className="h-[320px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data?.attendanceOverview) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Attendance Overview</h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load attendance chart.</p>
      </div>
    );
  }

  const attendance = data.attendanceOverview;
  const total = attendance.present + attendance.absent + attendance.late;
  const presentPercentage = total > 0 ? Math.round((attendance.present / total) * 100) : 0;

  const chartData = [
    { name: 'Present', value: attendance.present, fill: '#10b981' },
    { name: 'Absent', value: attendance.absent, fill: '#ef4444' },
    { name: 'Late', value: attendance.late, fill: '#f59e0b' },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Attendance Overview</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Today's marked attendance</p>
      </div>

      <div className="relative h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => value}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#0f172a',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-semibold text-slate-950 dark:text-white">{presentPercentage}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {chartData.map((item) => (
          <div key={item.name} className="min-w-0 text-center">
            <div className="mb-1 flex items-center justify-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                {item.name}
              </span>
            </div>
            <p className="text-base font-semibold text-slate-950 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AttendanceDonutChart;
