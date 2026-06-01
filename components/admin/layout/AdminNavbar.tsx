'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Moon, Sun, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import GlobalSearchModal from '@/components/admin/shared/GlobalSearchModal';
import NotificationDropdown from '@/components/admin/shared/NotificationDropdown';
import UserProfileDropdown from '@/components/admin/shared/UserProfileDropdown';

interface AdminNavbarProps {
  isSidebarCollapsed: boolean;
  onMobileMenuClick: () => void;
}

function isEntityIdSegment(segment: string): boolean {
  return (
    /^c[a-z0-9]{20,}$/i.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment) ||
    /^[a-z0-9]{16,}$/i.test(segment)
  );
}

function toTitleCase(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatSegmentLabel(segment: string, index: number, allSegments: string[]): string {
  const lower = segment.toLowerCase();

  if (isEntityIdSegment(segment)) {
    const parent = allSegments[index - 1]?.toLowerCase();
    if (parent === 'students') return 'Student Profile';
    if (parent === 'teachers') return 'Teacher Profile';
    if (parent === 'parents') return 'Parent Profile';
    if (parent === 'batches') return 'Batch Details';
    return 'Details';
  }

  if (lower === 'id') return 'Details';
  return toTitleCase(segment);
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onMobileMenuClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    // Fetch the logged-in user profile dynamically
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success && resJson.data?.user) {
          setUser(resJson.data.user);
        }
      })
      .catch((err) => console.error('Error fetching user profile:', err));
  }, []);

  const isDarkMode = mounted ? theme === 'dark' : false;

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = formatSegmentLabel(segment, idx, segments);
    return { label, href };
  });

  const pageTitle = breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Dashboard';

  return (
    <>
      <header className="tp-glass sticky top-0 z-30 flex h-[4.25rem] items-center justify-between border-b border-slate-200/60 px-3 md:px-5 xl:px-8 dark:border-slate-800/60">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="rounded-xl p-2.5 text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/50 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl dark:text-white">
              {pageTitle}
            </h1>
            {breadcrumbItems.length > 1 && (
              <div className="mt-0.5 hidden items-center gap-1 text-xs text-slate-500 md:flex dark:text-slate-400">
                {breadcrumbItems.map((item, idx) => (
                  <span key={item.href} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                    <span
                      className={
                        idx === breadcrumbItems.length - 1
                          ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                          : ''
                      }
                    >
                      {item.label}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="rounded-xl p-2.5 text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/50"
            title="Search"
          >
            <Search size={20} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative rounded-xl p-2.5 text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/50"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </button>
            {isNotificationOpen && (
              <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
            )}
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl p-2.5 text-slate-600 transition-all hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950/50"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-xl py-1.5 pr-2 pl-1.5 transition-all hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <ChevronDown size={16} className="hidden text-slate-500 md:block dark:text-slate-400" />
            </button>
            {isProfileOpen && (
              <UserProfileDropdown user={user} onClose={() => setIsProfileOpen(false)} />
            )}
          </div>
        </div>
      </header>

      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default AdminNavbar;
