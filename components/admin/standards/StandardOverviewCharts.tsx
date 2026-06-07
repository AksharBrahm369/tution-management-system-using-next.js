'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StandardOverviewChartsProps {
  attendance: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  studentCategories: {
    topper: number;
    good: number;
    average: number;
    weak: number;
  };
  fees: {
    collected: number;
    pending: number;
    total: number;
  };
}

export default function StandardOverviewCharts({
  attendance,
  studentCategories,
  fees,
}: StandardOverviewChartsProps) {
  // 1. Attendance Data
  const totalAttendance = attendance.present + attendance.absent + attendance.late + attendance.leave;
  const presentPercentage = totalAttendance > 0 
    ? Math.round(((attendance.present + attendance.late) / totalAttendance) * 100) 
    : 0;

  const attendanceData = [
    { name: 'Present', value: attendance.present, fill: '#10b981' },
    { name: 'Absent', value: attendance.absent, fill: '#ef4444' },
    { name: 'Late', value: attendance.late, fill: '#f59e0b' },
    { name: 'Leave', value: attendance.leave, fill: '#6366f1' },
  ].filter(item => item.value > 0);

  // Fallback if no attendance records exist
  const hasAttendance = totalAttendance > 0;

  // 2. Student Categories Data
  const categoryData = [
    { name: 'Topper', count: studentCategories.topper, fill: '#3b82f6' },
    { name: 'Good', count: studentCategories.good, fill: '#10b981' },
    { name: 'Average', count: studentCategories.average, fill: '#f59e0b' },
    { name: 'Weak', count: studentCategories.weak, fill: '#ef4444' },
  ];
  const totalStudents = studentCategories.topper + studentCategories.good + studentCategories.average + studentCategories.weak;

  // 3. Fees Data
  const totalFees = fees.total;
  const feeData = [
    { name: 'Collected', value: fees.collected, fill: '#10b981' },
    { name: 'Pending', value: fees.pending, fill: '#ef4444' },
  ].filter(item => item.value > 0);
  const feeCollectedPercent = totalFees > 0 ? Math.round((fees.collected / totalFees) * 100) : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* Attendance Donut Chart */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Attendance Status
        </h3>
        {hasAttendance ? (
          <div className="relative flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} records`, 'Status']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center top-[110px] transform -translate-y-1/2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{presentPercentage}%</span>
              <span className="text-xs font-medium text-slate-500">Attendance Rate</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="text-center">
                <span className="text-xs text-slate-500">Present</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{attendance.present}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500">Absent</span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{attendance.absent}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center text-sm text-slate-400">
            No attendance records found.
          </div>
        )}
      </div>

      {/* Student Category Distribution */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Student Categories
        </h3>
        {totalStudents > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => [`${value} students`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
              <span>Total Classified: {totalStudents}</span>
              <span>Average / Toppers make up {totalStudents > 0 ? Math.round(((studentCategories.topper + studentCategories.good) / totalStudents) * 100) : 0}%</span>
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center text-sm text-slate-400">
            No students categorized.
          </div>
        )}
      </div>

      {/* Fees Collection Chart */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Fees Collection
        </h3>
        {totalFees > 0 ? (
          <div className="relative flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={feeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹ ${Number(value).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center top-[110px] transform -translate-y-1/2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{feeCollectedPercent}%</span>
              <span className="text-xs font-medium text-slate-500">Collected</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="text-center">
                <span className="text-xs text-slate-500">Collected</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{fees.collected.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500">Pending</span>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">₹{fees.pending.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center text-sm text-slate-400">
            No fee records found for this standard.
          </div>
        )}
      </div>
    </div>
  );
}
