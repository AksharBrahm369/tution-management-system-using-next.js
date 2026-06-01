'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';

interface UserProfileDropdownProps {
  onClose: () => void;
  user?: { name: string; email: string } | null;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onClose, user }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Admin User'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'admin@tuitionpro.com'}</p>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        <button
          onClick={() => {
            router.push('/admin/settings');
            onClose();
          }}
          className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left"
        >
          <User size={18} />
          My Profile
        </button>

        <button
          onClick={() => {
            router.push('/admin/settings');
            onClose();
          }}
          className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-left"
        >
          <Settings size={18} />
          Settings
        </button>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm text-left"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfileDropdown;
