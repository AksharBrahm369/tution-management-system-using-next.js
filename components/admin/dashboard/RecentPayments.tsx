'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  date: Date | string;
  method: 'Cash' | 'Online' | 'Cheque';
  avatar: string;
}

const methodClasses: Record<string, string> = {
  Cash: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
  Online: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
  Cheque: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/50',
};

const RecentPayments: React.FC = () => {
  const { data: payments, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/recent-payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Recent Payments</h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent Payments</h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load recent payments.</p>
      </div>
    );
  }

  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Recent Payments</h2>

      <div className="space-y-3">
        {payments && payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-slate-700">
                  {payment.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950 dark:text-white">{payment.studentName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(payment.date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-semibold text-slate-950 dark:text-white">
                  Rs. {payment.amount.toLocaleString('en-IN')}
                </p>
                <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${methodClasses[payment.method] ?? methodClasses.Online}`}>
                  {payment.method}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No payments recorded yet.
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentPayments;
