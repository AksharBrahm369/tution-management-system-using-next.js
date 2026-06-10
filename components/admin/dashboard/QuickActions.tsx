'use client';

import React from 'react';
import Link from 'next/link';
import {
  Banknote,
  BarChart3,
  BookPlus,
  CheckSquare,
  Clock,
  FileText,
  HelpCircle,
  Megaphone,
  UserPlus,
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const actions: QuickAction[] = [
  { label: 'Add Student', icon: <UserPlus size={18} />, href: '/admin/students/add' },
  { label: 'Add Teacher', icon: <BookPlus size={18} />, href: '/admin/teachers/add' },
  { label: 'Mark Attendance', icon: <CheckSquare size={18} />, href: '/admin/attendance' },
  { label: 'Collect Fee', icon: <Banknote size={18} />, href: '/admin/fees/collect' },
  { label: 'Create Exam', icon: <FileText size={18} />, href: '/admin/exams/create' },
  { label: 'Announcement', icon: <Megaphone size={18} />, href: '/admin/communication' },
  { label: 'Enquiries', icon: <HelpCircle size={18} />, href: '/admin/enquiries' },
  { label: 'Reports', icon: <BarChart3 size={18} />, href: '/admin/reports' },
  { label: 'Schedule Class', icon: <Clock size={18} />, href: '/admin/batches' },
];

const QuickActions: React.FC = () => {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Common institute workflows</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:hover:border-blue-900/70 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {action.icon}
            </span>
            <span className="min-w-0 leading-5">{action.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
