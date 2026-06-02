import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Management</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        User management is not available yet. Manage institute security and account settings from the settings area.
      </p>
      <Link
        href="/admin/settings"
        className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        Open Settings
      </Link>
    </div>
  );
}
