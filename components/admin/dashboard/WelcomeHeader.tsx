'use client';

import React, { useSyncExternalStore } from 'react';

interface WelcomeHeaderProps {
  adminName?: string;
}

function subscribeToTimeChanges(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(timer);
}

const INDIA_TIMEZONE = 'Asia/Kolkata';

function getGreetingSnapshot() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: INDIA_TIMEZONE,
    hour: 'numeric',
    hour12: false,
  });
  const hour = Number(formatter.format(new Date()));

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getDateSnapshot() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ adminName = 'Admin' }) => {
  const greeting = useSyncExternalStore(subscribeToTimeChanges, getGreetingSnapshot, () => 'Welcome');
  const formattedDate = useSyncExternalStore(subscribeToTimeChanges, getDateSnapshot, () => '');

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of today's institute activity</p>
          {formattedDate ? (
            <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">{formattedDate}</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/60">
          <p className="font-medium text-slate-900 dark:text-white">{greeting}, {adminName}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Signed in as administrator</p>
        </div>
      </div>
    </section>
  );
};

export default WelcomeHeader;
