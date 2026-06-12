'use client';

import React from 'react';
import { Clock, MapPin, Video, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Class {
  id: string;
  name: string;
  teacher: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  meetingLink?: string | null;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

function hasRealTeacherName(teacher: string) {
  const normalizedTeacher = teacher.trim().toLowerCase();
  return Boolean(
    normalizedTeacher &&
    normalizedTeacher !== 'tba' &&
    normalizedTeacher !== 'teacher not assigned'
  );
}

function formatTimeTo12Hour(time: string) {
  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return time;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

const TodaysClasses: React.FC = () => {
  const { data: classes, isLoading, isError } = useQuery<Class[]>({
    queryKey: ['todays-classes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard/todays-classes');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/50',
      ongoing: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/50',
      completed: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    };
    return colors[status] || colors.upcoming;
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">
          Today&apos;s Classes
        </h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-950 dark:text-white">Today&apos;s Classes</h3>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">Could not load today&apos;s classes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Today&apos;s Classes
        </h3>
      </div>

      {classes && classes.length > 0 ? (
        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5 transition-colors hover:bg-slate-100/30 dark:border-slate-800/40 dark:bg-slate-950/20 dark:hover:bg-slate-900/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {classItem.name}
                  </p>
                  {hasRealTeacherName(classItem.teacher) ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <User size={12} className="text-slate-400" />
                      {classItem.teacher}
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                    classItem.status
                  )}`}
                >
                  {classItem.status}
                </span>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatTimeTo12Hour(classItem.startTime)} - {formatTimeTo12Hour(classItem.endTime)}
                </div>
                <div className="flex items-center gap-1">
                  <Video size={12} />
                  {classItem.isOnline ? 'Online' : 'Offline'}
                </div>
                {!classItem.isOnline && classItem.room ? (
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {classItem.room}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center py-8 text-center text-xs text-slate-400">
          No classes scheduled today
        </div>
      )}
    </div>
  );
};

export default TodaysClasses;
