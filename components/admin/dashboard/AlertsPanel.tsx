'use client';

import React from 'react';
import {
  AlertCircle,
  TrendingDown,
  Users,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface Alert {
  id: string;
  type: 'LOW_ATTENDANCE' | 'FEE_OVERDUE' | 'STUDENT_ABSENT' | 'NEW_ENQUIRY' | 'SYSTEM';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date | string;
}

const AlertsPanel: React.FC = () => {
  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
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

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return colors[severity] || colors.LOW;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm h-full">
        <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
          Alerts
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm h-full">
      <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
        Alerts
      </h3>

      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-l-4"
              style={{
                borderLeftColor: alert.severity === 'CRITICAL' ? '#ef4444' :
                                alert.severity === 'HIGH' ? '#f59e0b' :
                                alert.severity === 'MEDIUM' ? '#eab308' : '#3b82f6'
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          No active alerts
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
