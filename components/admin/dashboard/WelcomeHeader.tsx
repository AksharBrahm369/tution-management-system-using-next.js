import React from 'react';
import { formatDate } from '@/lib/utils';

interface WelcomeHeaderProps {
  adminName?: string;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ adminName = 'Admin User' }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = formatDate(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 shadow-sm md:p-6 dark:border-[#1F2937] dark:from-slate-900 dark:via-[#111827] dark:to-slate-900">
      <div className="flex items-start justify-between gap-4 md:gap-6">
        <div className="flex-1">
          <h2 className="break-words bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl dark:from-[#F8FAFC] dark:to-[#CBD5E1]">
            {getGreeting()}, {adminName}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-[#94A3B8]">
            {formattedDate}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Here is what is happening today.
          </p>
        </div>

        <div className="hidden items-center md:flex">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-xl font-bold text-white shadow-lg shadow-blue-900/30">
            A
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeHeader;
