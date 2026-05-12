'use client';

import React from 'react';

const FeesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Fee Management</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Manage student fees and payments</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Coming Soon</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Fee management module is under development</p>
      </div>
    </div>
  );
};

export default FeesPage;
