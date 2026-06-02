import React from 'react';
import { formatDate } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface WelcomeHeaderProps {
  adminName?: string;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ adminName = 'Admin' }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedDate = formatDate(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-indigo-200/50 bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-700 p-6 shadow-lg shadow-indigo-500/20 md:p-8 dark:border-indigo-500/30">
      <div className="blob absolute -right-10 -top-10 h-40 w-40 bg-white/20" />
      <div className="blob absolute bottom-0 left-1/4 h-32 w-32 bg-cyan-400/20" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 flex items-start justify-between gap-4 md:gap-6">
        <div className="flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Dashboard Overview
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {getGreeting()}, {adminName}
          </h2>
          <p className="mt-2 text-sm font-medium text-indigo-100">{formattedDate}</p>
          <p className="mt-1 text-sm text-indigo-200/80">Here is what is happening at your institute today.</p>
        </div>

        <div className="hidden items-center md:flex">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white ring-2 ring-white/30 backdrop-blur-sm">
            A
          </div>
        </div>
      </div>
    </section>
  );
};

export default WelcomeHeader;
