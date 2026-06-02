'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  student?: {
    firstName?: string;
    lastName?: string;
    studentCode?: string;
  };
  batch?: {
    id?: string;
    name?: string;
  };
}

async function fetchAttendanceReport(batchId: string | null) {
  const params = new URLSearchParams({ limit: '50' });
  if (batchId) params.set('batchId', batchId);

  const response = await fetch(`/api/admin/attendance?${params.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error('Failed to load attendance report');
  }

  return response.json();
}

export default function AttendanceReportsPage() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batch');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendance-report', batchId],
    queryFn: () => fetchAttendanceReport(batchId),
  });

  const records: AttendanceRecord[] = data?.data?.records ?? data?.records ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <Link
          href="/admin/attendance"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to attendance
        </Link>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
            Attendance Reports
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Recent attendance records
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {batchId ? 'Showing records filtered for the selected batch.' : 'Showing the latest attendance records.'}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading attendance report...
          </div>
        ) : isError ? (
          <div className="p-8 text-sm text-red-600 dark:text-red-300">
            Could not load attendance report.
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-sm text-slate-500 dark:text-slate-400">
            No attendance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Batch</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {records.map((record) => {
                  const studentName = `${record.student?.firstName ?? ''} ${record.student?.lastName ?? ''}`.trim();
                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {record.date ? new Date(record.date).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {studentName || record.student?.studentCode || 'Student'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {record.batch?.name ?? 'Batch'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
