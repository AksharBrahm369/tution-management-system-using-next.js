'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface ChartData {
  attendanceOverview: {
    present: number;
    absent: number;
    late: number;
  };
}

const AttendanceDonutChart: React.FC = () => {
  const { data, isLoading } = useQuery<ChartData>({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/charts');
      if (!response.ok) throw new Error('Failed to fetch charts');
      return response.json();
    },
  });

  if (isLoading || !data?.attendanceOverview) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 h-80 flex flex-col items-center justify-center shadow-lg">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-green-500 animate-spin mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">Loading chart...</div>
      </div>
    );
  }

  const attendance = data.attendanceOverview;
  const total = attendance.present + attendance.absent + attendance.late;
  const presentPercentage = Math.round((attendance.present / total) * 100);

  const chartData = [
    { name: 'Present', value: attendance.present, fill: '#10b981' },
    { name: 'Absent', value: attendance.absent, fill: '#ef4444' },
    { name: 'Late', value: attendance.late, fill: '#f59e0b' },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        Attendance Overview
      </h3>

      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => value}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {presentPercentage}%
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        {chartData.map((item) => (
          <div key={item.name} className="text-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {item.name}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceDonutChart;
