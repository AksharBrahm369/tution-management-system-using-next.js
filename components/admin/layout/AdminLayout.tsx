'use client';

import React, { useSyncExternalStore } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import type { CurrentAdminUser } from '@/lib/adminAuth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: CurrentAdminUser;
}

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';
const SIDEBAR_CHANGE_EVENT = 'admin-sidebar-collapsed-change';

function subscribeToLayoutChanges(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('resize', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('resize', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function getSidebarCollapsedSnapshot() {
  if (typeof window === 'undefined') return false;

  const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (saved !== null) {
    try {
      return Boolean(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse admin-sidebar-collapsed from localStorage:', e);
    }
  }

  return window.innerWidth < 1200;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, user }) => {
  const isSidebarCollapsed = useSyncExternalStore(
    subscribeToLayoutChanges,
    getSidebarCollapsedSnapshot,
    () => false
  );

  const handleSidebarToggle = (collapsed: boolean) => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(collapsed));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  };

  return (
    <SidebarProvider
      defaultOpen={!isSidebarCollapsed}
      open={!isSidebarCollapsed}
      onOpenChange={(open) => handleSidebarToggle(!open)}
    >
      <div className="app-mesh-bg relative flex h-screen w-full overflow-hidden">
        <div className="blob -left-32 top-0 h-72 w-72 bg-indigo-400/20 dark:bg-indigo-600/15 pointer-events-none" />
        <div
          className="blob right-0 top-1/4 h-96 w-96 bg-cyan-400/15 dark:bg-cyan-500/10 pointer-events-none"
          style={{ animationDelay: '-6s' }}
        />

        <AdminSidebar user={user} />

        <SidebarInset className="relative flex h-full flex-col overflow-hidden bg-transparent dark:bg-transparent">
          <AdminNavbar
            user={user}
            isSidebarCollapsed={isSidebarCollapsed}
            onMobileMenuClick={() => {}}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 md:px-5 md:py-5 xl:px-8 xl:py-6">
            <div className="page-enter mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;

