'use client';

import React from 'react';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      STUDENT_ENROLLED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      FEE_RECEIVED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      LOW_ATTENDANCE: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      NEW_ENQUIRY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      EXAM_RESULT: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      ANNOUNCEMENT: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
      GENERAL: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    };
    return colors[type] || colors.GENERAL;
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            aria-label="Mark all notifications as read"
            onClick={() => markAllRead()}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
        {isLoading ? (
          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
            Loading...
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    !notification.isRead ? 'bg-blue-600' : 'bg-transparent'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      {notification.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full shrink-0 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No notifications
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
          <a
            href="#"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
