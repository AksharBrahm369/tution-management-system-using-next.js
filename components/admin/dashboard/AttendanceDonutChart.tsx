'use client';

import React from 'react';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeasuredChartSize } from './useMeasuredChartSize';

interface ChartData {
  attendanceOverview: {
    present: number;
    absent: number;
    late: number;
  };
}

const AttendanceDonutChart: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);
  const [chartRef, chartSize] = useMeasuredChartSize(170);

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
      <div className="h-full min-h-[330px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="mb-3 h-4 w-44" />
        <Skeleton className="h-[250px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data?.attendanceOverview) {
    return (
      <div className="h-full min-h-[330px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Attendance Overview</h2>
        <p className="mt-4 text-xs text-red-600 dark:text-red-300">Could not load attendance chart.</p>
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
    <section className="flex h-full min-h-[330px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Attendance Overview</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-between gap-3">
        {/* Chart View */}
        <div ref={chartRef} className="relative mx-auto h-[170px] min-h-[170px] w-[170px] shrink-0 overflow-hidden" style={{ width: 170, height: 170 }}>
          {chartSize.isReady ? (
            <PieChart width={chartSize.width} height={chartSize.height}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
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
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                }}
              />
            </PieChart>
          ) : null}

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-slate-950 dark:text-white">{presentPercentage}%</p>
            <p className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500">Present</p>
          </div>
        </div>

        {/* Legend / Metrics below chart */}
        <div className="w-full border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            {chartData.map((item) => (
              <div key={item.name} className="min-w-0">
                <div className="mb-1.5 flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item.name}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                  {item.value} <span className="text-[10px] text-slate-400 font-medium">{item.value === 1 ? 'student' : 'students'}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100/60 pt-2.5 text-xs font-semibold text-slate-400 dark:border-slate-800/60">
            <span>Total Tracked</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{total} students</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttendanceDonutChart;
