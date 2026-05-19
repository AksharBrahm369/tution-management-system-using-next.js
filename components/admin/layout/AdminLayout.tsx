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
        console.error("Failed to parse admin-sidebar-collapsed from localStorage:", e);
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

  const desktopSidebarWidth = isSidebarCollapsed ? 72 : 260;
  const contentMarginLeft = isDesktop ? desktopSidebarWidth : 0;

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#0F172A]">
      {/* Sidebar */}
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={handleMobileSidebarToggle}
        isDesktop={isDesktop}
      />

      {/* Main Content Container */}
      <div
        className="flex h-full flex-col overflow-hidden transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: `${contentMarginLeft}px` }}
      >
        {/* Navbar */}
        <AdminNavbar
          isSidebarCollapsed={isSidebarCollapsed}
          onMobileMenuClick={() => handleMobileSidebarToggle(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 md:px-4 md:py-4 xl:px-6 xl:py-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
