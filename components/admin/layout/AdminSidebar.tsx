'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle,
  Banknote,
  FileText,
  BookMarked,
  MessageSquare,
  Users2,
  HelpCircle,
  BarChart3,
  Settings,
  Shield,
  ActivitySquare,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
  isDesktop: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileToggle,
  isDesktop,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const navSections: NavSection[] = [
    {
      title: 'MAIN MENU',
      items: [
        {
          label: 'Dashboard',
          href: '/admin/dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: 'Students',
          href: '/admin/students',
          icon: <Users size={20} />,
        },
        {
          label: 'Teachers',
          href: '/admin/teachers',
          icon: <GraduationCap size={20} />,
        },
        {
          label: 'Batches',
          href: '/admin/batches',
          icon: <BookOpen size={20} />,
        },
        {
          label: 'Attendance',
          href: '/admin/attendance',
          icon: <CheckCircle size={20} />,
        },
        {
          label: 'Fees',
          href: '/admin/fees',
          icon: <Banknote size={20} />,
        },
        {
          label: 'Exams & Results',
          href: '/admin/exams',
          icon: <FileText size={20} />,
        },
        {
          label: 'Study Material',
          href: '/admin/materials',
          icon: <BookMarked size={20} />,
        },
        {
          label: 'Communication',
          href: '/admin/communication',
          icon: <MessageSquare size={20} />,
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        {
          label: 'Parents',
          href: '/admin/parents',
          icon: <Users2 size={20} />,
        },
        {
          label: 'Enquiries',
          href: '/admin/enquiries',
          icon: <HelpCircle size={20} />,
        },
        {
          label: 'Reports',
          href: '/admin/reports',
          icon: <BarChart3 size={20} />,
        },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: <Settings size={20} />,
        },
        {
          label: 'User Management',
          href: '/admin/users',
          icon: <Shield size={20} />,
        },
        {
          label: 'Activity Logs',
          href: '/admin/logs',
          icon: <ActivitySquare size={20} />,
        },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const sidebarWidth = isCollapsed ? 72 : 260;
  const sidebarTransform = isDesktop || isMobileOpen ? 'translateX(0)' : 'translateX(-100%)';

  return (
    <>
      {/* Mobile Overlay */}
      {!isDesktop && isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[1px]"
          onClick={() => onMobileToggle(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="
          fixed top-0 left-0 z-40 h-screen
          flex flex-col
          bg-[#0B1120] text-white
          border-r border-slate-800/80
          shadow-2xl shadow-slate-950/40
          transition-all duration-300 ease-in-out
        "
        style={{
          width: `${sidebarWidth}px`,
          transform: sidebarTransform,
        }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap size={24} className="text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl tracking-tight">TuitionPro</span>
            )}
          </div>

          {/* Collapse Toggle */}
          {!isCollapsed && (
            <button
              onClick={() => onToggleCollapse(true)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {/* Expand Toggle */}
          {isCollapsed && (
            <button
              onClick={() => onToggleCollapse(false)}
              className="absolute -right-3 top-6 hidden rounded-full border-2 border-slate-700 bg-slate-800 p-1 text-slate-300 shadow-md transition-all hover:bg-slate-700 hover:text-white lg:flex"
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-[0.12em]">
                  {section.title}
                </h3>
              )}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onMobileToggle(false)}
                    className={`
                      flex items-center gap-3
                      px-3 py-2.5
                      rounded-xl text-sm
                      transition-all duration-200 ease-in-out
                      ${
                        isActive(item.href)
                          ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-900/30'
                          : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="flex-shrink-0 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section - User & Logout */}
        <div className="border-t border-slate-800 p-3">
          {/* User Profile */}
          <div
            className={`
              flex items-center gap-3 mb-3
              px-3 py-2.5
              rounded-xl
              bg-slate-800/60
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
              A
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">Admin User</p>
                <p className="text-xs text-slate-400 truncate">Super Admin</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3
              px-3 py-2.5
              rounded-xl
              text-slate-300
              hover:bg-slate-800
              hover:text-white
              transition-all duration-200 ease-in-out
              ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
