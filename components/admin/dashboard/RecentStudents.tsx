'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
  joinDate: Date | string;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
}

const feeStatusStyles: Record<string, string> = {
  Paid: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400',
  Overdue: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Recent Registrations
        </h2>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Recent Registrations
        </h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load recent students.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/60">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Registrations
          </h2>
        </div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          View Directory <ArrowUpRight size={14} />
        </Link>
      </div>

      {!students || students.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No students enrolled yet.
        </div>
      ) : (
        <>
          {/* Mobile view: converted into clean cards */}
          <div className="space-y-3 p-4 sm:hidden">
            {students.map((student) => (
              <article
                key={student.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {getInitials(student.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-905 dark:text-white">{student.name}</p>
                      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${feeStatusStyles[student.feeStatus] ?? feeStatusStyles.Pending}`}>
                    {student.feeStatus}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800/40">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Batch</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{student.batch}</p>
                  </div>
                  <Link
                    href={`/admin/students/${student.id}`}
                    className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Profile <ArrowUpRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop view: high-density table */}
          <div className="hidden sm:block overflow-x-auto max-h-[360px] overflow-y-auto relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-950/30">
                  <th className="sticky top-0 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400 z-10">
                    Student
                  </th>
                  <th className="sticky top-0 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400 z-10">
                    Batch
                  </th>
                  <th className="sticky top-0 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400 z-10">
                    Registered
                  </th>
                  <th className="sticky top-0 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400 z-10">
                    Fee Status
                  </th>
                  <th className="sticky top-0 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400 z-10 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-850/30"
                  >
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getInitials(student.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {student.name}
                          </p>
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 animate-none">
                      {student.batch}
                    </td>
                    <td className="px-5 py-2.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {formatDistanceToNow(new Date(student.joinDate), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-bold ${feeStatusStyles[student.feeStatus] ?? feeStatusStyles.Pending}`}>
                        {student.feeStatus}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 animate-none"
                      >
                        Profile <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default RecentStudents;
