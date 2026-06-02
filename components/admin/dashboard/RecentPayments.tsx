'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  date: Date | string;
  method: 'Cash' | 'Online' | 'Cheque';
  avatar: string;
}

const RecentPayments: React.FC = () => {
  const { data: payments, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/recent-payments');
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      Cash: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      Online: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      Cheque: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    };
    return colors[method] || colors.Online;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Payments
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg h-full">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Payments</h3>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load recent payments.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm h-full">
      <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
        Recent Payments
      </h3>

      <div className="space-y-3">
        {payments && payments.length > 0 ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {payment.avatar}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {payment.studentName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(payment.date), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    ₹ {payment.amount.toLocaleString('en-IN')}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getMethodColor(
                      payment.method
                    )}`}
                  >
                    {payment.method}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No payments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPayments;
