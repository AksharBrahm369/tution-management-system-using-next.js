'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
  joinDate: Date | string;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
}

const RecentStudents: React.FC = () => {
  const { data: students, isLoading, isError } = useQuery<Student[]>({
    queryKey: ['recent-students'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/recent-students');
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const getFeeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      Pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      Overdue: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[status] || colors.Pending;
  };

  if (isLoading) {
    return (
      <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-lg font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
            Recent Students
          </h3>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Students</h3>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load recent students.</p>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-lg backdrop-blur-sm">
      <div className="p-6">
        <h3 className="text-lg font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
          Recent Students
        </h3>

        {!students || students.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No students enrolled yet.</p>
            <p className="text-xs mt-1">Add students to see them here.</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                  Student
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                  Batch
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                  Join Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                  Fee Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {student.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {student.batch}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {formatDistanceToNow(new Date(student.joinDate), { addSuffix: true })}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${getFeeStatusColor(
                        student.feeStatus
                      )}`}
                    >
                      {student.feeStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      View <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default RecentStudents;
