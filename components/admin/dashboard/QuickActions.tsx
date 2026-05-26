'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  BookPlus,
  CheckSquare,
  Banknote,
  FileText,
  Megaphone,
  BarChart3,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'indigo' | 'pink';
}

const colorClasses: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
};

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      label: 'Add Student',
      icon: <UserPlus size={24} />,
      href: '/admin/students/new',
      color: 'blue',
    },
    {
      label: 'Add Teacher',
      icon: <BookPlus size={24} />,
      href: '/admin/teachers/new',
      color: 'purple',
    },
    {
      label: 'Mark Attendance',
      icon: <CheckSquare size={24} />,
      href: '/admin/attendance',
      color: 'green',
    },
    {
      label: 'Collect Fee',
      icon: <Banknote size={24} />,
      href: '/admin/fees',
      color: 'orange',
    },
    {
      label: 'Create Exam',
      icon: <FileText size={24} />,
      href: '/admin/exams/new',
      color: 'indigo',
    },
    {
      label: 'Send Announcement',
      icon: <Megaphone size={24} />,
      href: '/admin/communication',
      color: 'pink',
    },
    {
      label: 'Manage Enquiries',
      icon: <HelpCircle size={24} />,
      href: '/admin/enquiries',
      color: 'green',
    },
    {
      label: 'Generate Report',
      icon: <BarChart3 size={24} />,
      href: '/admin/reports',
      color: 'red',
    },
    {
      label: 'Schedule Class',
      icon: <Clock size={24} />,
      href: '/admin/batches',
      color: 'blue',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/50 bg-white p-6 shadow-lg dark:border-slate-700/50 dark:bg-slate-900/50">
      <h3 className="mb-6 text-lg font-bold text-slate-900 dark:text-white">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const colors = colorClasses[action.color];
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1 ${colors.bg}`}
            >
              <div className={`${colors.text} hover:scale-110 transition-transform`}>{action.icon}</div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white text-center">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
