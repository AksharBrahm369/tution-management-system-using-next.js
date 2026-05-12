'use client';

import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Class {
  id: string;
  name: string;
  teacher: string;
  time: string;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

const TodaysClasses: React.FC = () => {
  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ['todays-classes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/todays-classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      ongoing: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      completed: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    };
    return colors[status] || colors.upcoming;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Today's Classes
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/50 dark:to-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm h-full">
      <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
        Today's Classes
      </h3>

      {classes && classes.length > 0 ? (
        <div className="space-y-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {classItem.name}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    by {classItem.teacher}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${getStatusColor(
                    classItem.status
                  )}`}
                >
                  {classItem.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-3">
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  {classItem.time}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  {classItem.room}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
          No classes scheduled today
        </div>
      )}
    </div>
  );
};

export default TodaysClasses;
