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
    staleTime: 30_000,
    refetchInterval: 60_000,
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
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Recent Collections</h3>
      </div>

      {payments && payments.length > 0 ? (
        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800/40 dark:bg-slate-950/20"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-slate-800 dark:text-slate-200">
                  {payment.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{payment.studentName}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatDistanceToNow(new Date(payment.date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </p>
                <span className={`inline-block rounded border px-1 py-0.25 text-[9px] font-semibold ${methodClasses[payment.method] ?? methodClasses.Online}`}>
                  {payment.method}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-slate-400">
          No payments recorded yet
        </div>
      )}
    </div>
  );
};

export default RecentPayments;
