'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) {
      try {
        setIsSidebarCollapsed(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse admin-sidebar-collapsed from localStorage:', e);
      }
    }

    const onResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      if (window.innerWidth < 1200) {
        setIsSidebarCollapsed(true);
      }
      if (desktop) {
        setIsMobileSidebarOpen(false);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(collapsed));
  };

  const handleMobileSidebarToggle = (open: boolean) => {
    setIsMobileSidebarOpen(open);
  };

  const desktopSidebarWidth = isSidebarCollapsed ? 76 : 268;
  const contentMarginLeft = isDesktop ? desktopSidebarWidth : 0;

  return (
    <div className="app-mesh-bg relative h-screen w-full overflow-hidden">
      <div className="blob -left-32 top-0 h-72 w-72 bg-indigo-400/20 dark:bg-indigo-600/15" />
      <div
        className="blob right-0 top-1/4 h-96 w-96 bg-cyan-400/15 dark:bg-cyan-500/10"
        style={{ animationDelay: '-6s' }}
      />

      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={handleMobileSidebarToggle}
        isDesktop={isDesktop}
      />

      <div
        className="relative flex h-full flex-col overflow-hidden transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ marginLeft: `${contentMarginLeft}px` }}
      >
        <AdminNavbar
          isSidebarCollapsed={isSidebarCollapsed}
          onMobileMenuClick={() => handleMobileSidebarToggle(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 md:px-5 md:py-5 xl:px-8 xl:py-6">
          <div className="page-enter mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
