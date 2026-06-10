'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface Alert {
  id: string;
  type: 'LOW_ATTENDANCE' | 'FEE_OVERDUE' | 'STUDENT_ABSENT' | 'NEW_ENQUIRY' | 'SYSTEM';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date | string;
}

const severityClasses: Record<string, string> = {
  LOW: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300',
  HIGH: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200',
  CRITICAL: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300',
};

const AlertsPanel: React.FC = () => {
  const { data: alerts, isLoading, isError } = useQuery<Alert[]>({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const getAlertIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      LOW_ATTENDANCE: <TrendingDown size={18} />,
      FEE_OVERDUE: <AlertTriangle size={18} />,
      STUDENT_ABSENT: <Users size={18} />,
      NEW_ENQUIRY: <HelpCircle size={18} />,
      SYSTEM: <AlertCircle size={18} />,
    };
    return icons[type] || icons.SYSTEM;
  };

  if (isLoading) {
    return (
      <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Alerts</h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Alerts</h2>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load alerts.</p>
      </div>
    );
  }

  return (
    <section className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Alerts</h2>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${severityClasses[alert.severity] ?? severityClasses.LOW}`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-white/65 p-2 dark:bg-slate-950/35">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="mt-2 text-xs opacity-75">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No active alerts
        </div>
      )}
    </section>
  );
};

export default AlertsPanel;
