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
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const getTimelineColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-500 border-blue-200 dark:border-blue-900',
      MEDIUM: 'bg-amber-500 border-amber-200 dark:border-amber-900',
      HIGH: 'bg-orange-500 border-orange-200 dark:border-orange-900',
      CRITICAL: 'bg-red-500 border-red-200 dark:border-red-900',
    };
    return colors[severity] || 'bg-slate-400 border-slate-200 dark:border-slate-800';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Activity Timeline
        </h2>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Activity Timeline
        </h2>
        <p className="text-xs text-red-600 dark:text-red-300">Could not load activity feed.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Activity Timeline
        </h2>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="relative border-l border-slate-100 pl-4 space-y-4 ml-2 max-h-[300px] overflow-y-auto dark:border-slate-800 pr-1">
          {alerts.map((alert) => (
            <div key={alert.id} className="relative group">
              {/* Timeline dot */}
              <div
                className={`absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full border-2 ${getTimelineColor(
                  alert.severity
                )}`}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">
                  {alert.message}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-slate-400">
          No recent activity logs
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
