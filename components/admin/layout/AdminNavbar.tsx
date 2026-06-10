'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Moon, Sun, ChevronDown, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import GlobalSearchModal from '@/components/admin/shared/GlobalSearchModal';
import NotificationDropdown from '@/components/admin/shared/NotificationDropdown';
import UserProfileDropdown from '@/components/admin/shared/UserProfileDropdown';
import type { CurrentAdminUser } from '@/lib/adminAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';


interface AdminNavbarProps {
  user: CurrentAdminUser;
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

const AdminNavbar: React.FC<AdminNavbarProps> = ({ user: initialUser, onMobileMenuClick }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>(initialUser);
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success && resJson.data?.user) {
          setUser(resJson.data.user);
        }
      })
      .catch((err) => console.error('Error fetching user profile:', err));
  }, []);

  const isDarkMode = resolvedTheme === 'dark';

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = formatSegmentLabel(segment, idx, segments);
    return { label, href };
  });

  const pageTitle = breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Dashboard';
  const userInitial = user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'A';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm md:px-5 xl:px-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <SidebarTrigger className="h-10 w-10 rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-950 md:hidden dark:text-slate-100 dark:hover:bg-slate-800" />

          {pathname !== '/admin/dashboard' && pathname !== '/admin' && (
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
              title="Go Back"
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-normal text-slate-900 md:text-lg dark:text-white">
              {pageTitle}
            </p>
            {breadcrumbItems.length > 1 && (
              <div className="mt-0.5 hidden items-center gap-1 text-xs text-slate-500 md:flex dark:text-slate-400">
                {breadcrumbItems.map((item, idx) => (
                  <span key={item.href} className="flex items-center gap-1">
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                    <span
                      className={
                        idx === breadcrumbItems.length - 1
                          ? 'font-semibold text-slate-800 dark:text-slate-200'
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
            aria-label="Open global search"
            className="rounded-lg p-2.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            title="Search"
          >
            <Search size={20} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-label="Open notifications"
              className="relative rounded-lg p-2.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
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
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            aria-label="Toggle theme"
              className="rounded-lg p-2.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Open user menu"
              className="flex items-center gap-2 rounded-lg py-1.5 pr-2 pl-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-slate-700">
                {userInitial}
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
