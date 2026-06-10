'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  name: string;
  email: string;
  batch: string;
  joinDate: Date | string;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
}

const feeStatusClasses: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
  Overdue: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50',
};

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
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Recent Students</h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent Students</h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load recent students.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent Students</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recently enrolled students and fee status</p>
        </div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
        >
          View all <ChevronRight size={16} />
        </Link>
      </div>

      {!students || students.length === 0 ? (
        <div className="mx-5 mb-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No students enrolled yet.
        </div>
      ) : (
        <div className="tp-table-wrap rounded-none border-x-0 border-b-0 shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(student.joinDate), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${feeStatusClasses[student.feeStatus] ?? feeStatusClasses.Pending}`}>
                      {student.feeStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      View <ChevronRight size={14} />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default RecentStudents;
