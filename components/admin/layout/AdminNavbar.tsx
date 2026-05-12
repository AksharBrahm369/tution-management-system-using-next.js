'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import GlobalSearchModal from '@/components/admin/shared/GlobalSearchModal';
import NotificationDropdown from '@/components/admin/shared/NotificationDropdown';
import UserProfileDropdown from '@/components/admin/shared/UserProfileDropdown';

interface AdminNavbarProps {
  isSidebarCollapsed: boolean;
  onMobileMenuClick: () => void;
}

function isEntityIdSegment(segment: string): boolean {
  // Handles common DB id patterns: cuid-like, uuid and long opaque ids.
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

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  isSidebarCollapsed,
  onMobileMenuClick,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? theme === 'dark' : false;

  // Generate breadcrumb
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = segments.map((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const label = formatSegmentLabel(segment, idx, segments);
    return { label, href };
  });

  const pageTitle = breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Dashboard';

  return (
    <>
      <header
        className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/90 bg-white/95 px-3 backdrop-blur md:px-4 xl:px-6 dark:border-[#1F2937] dark:bg-[#111827]/95 ${
          isSidebarCollapsed ? 'shadow-sm' : 'shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuClick}
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu size={22} />
          </button>

          {/* Title & Breadcrumb */}
          <div>
            <h1 className="text-lg font-bold text-slate-900 md:text-xl dark:text-[#F8FAFC]">
              {pageTitle}
            </h1>
            {breadcrumbItems.length > 0 && (
              <div className="mt-0.5 hidden items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] md:flex">
                {breadcrumbItems.map((item, idx) => (
                  <span key={item.href}>
                    {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                    <span
                      className={
                        idx === breadcrumbItems.length - 1
                          ? 'font-medium text-slate-700 dark:text-slate-200'
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

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="rounded-xl p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Search"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative rounded-xl p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>
            {isNotificationOpen && (
              <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl p-2 text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-sm">
                A
              </div>
              <ChevronDown size={16} className="text-slate-500 dark:text-slate-400 hidden md:block" />
            </button>
            {isProfileOpen && (
              <UserProfileDropdown onClose={() => setIsProfileOpen(false)} />
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};

export default AdminNavbar;
