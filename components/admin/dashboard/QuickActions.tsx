'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Banknote,
  CheckSquare,
  FileText,
  BookPlus,
  BarChart3,
  Megaphone,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

const primaryActions = [
  { label: 'Add Student', icon: <UserPlus size={16} />, href: '/admin/students/add', desc: 'Register a new pupil' },
  { label: 'Collect Fee', icon: <Banknote size={16} />, href: '/admin/fees/collect', desc: 'Record student payment' },
  { label: 'Mark Attendance', icon: <CheckSquare size={16} />, href: '/admin/attendance', desc: 'Take daily attendance roll' },
  { label: 'Create Exam', icon: <FileText size={16} />, href: '/admin/exams/create', desc: 'Publish a new test score' },
];

const secondaryActions = [
  { label: 'Add Teacher', icon: <BookPlus size={14} />, href: '/admin/teachers/add' },
  { label: 'Reports', icon: <BarChart3 size={14} />, href: '/admin/reports' },
  { label: 'Announcement', icon: <Megaphone size={14} />, href: '/admin/communication' },
  { label: 'Schedule Class', icon: <Clock size={14} />, href: '/admin/batches' },
];

const QuickActions: React.FC = () => {
  return (
    <section className="flex h-full min-h-[260px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Command Center
        </h2>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        {/* Left 2 columns: Primary actions */}
        <div className="grid h-full grid-cols-1 gap-2 sm:grid-cols-2 md:col-span-2">
          {primaryActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex min-h-[88px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:border-slate-300 hover:bg-slate-100/30 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200">
                {action.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {action.label}
                </p>
                <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{action.desc}</p>
              </div>
              <ArrowUpRight size={13} className="shrink-0 text-slate-400 group-hover:text-slate-600" />
            </Link>
          ))}
        </div>

        {/* Right 1 column: Secondary actions */}
        <div className="flex h-full rounded-lg border border-slate-200 bg-slate-50/30 p-3 dark:border-slate-800 dark:bg-slate-950/20">
          <div className="w-full space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">System Actions</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {secondaryActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 animate-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400">{action.icon}</span>
                    <span>{action.label}</span>
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuickActions;
