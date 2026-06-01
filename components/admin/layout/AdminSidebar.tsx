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
  Sparkles,
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
      title: 'Main',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Students', href: '/admin/students', icon: <Users size={20} /> },
        { label: 'Teachers', href: '/admin/teachers', icon: <GraduationCap size={20} /> },
        { label: 'Batches', href: '/admin/batches', icon: <BookOpen size={20} /> },
        { label: 'Attendance', href: '/admin/attendance', icon: <CheckCircle size={20} /> },
        { label: 'Fees', href: '/admin/fees', icon: <Banknote size={20} /> },
        { label: 'Exams & Results', href: '/admin/exams', icon: <FileText size={20} /> },
        { label: 'Study Material', href: '/admin/materials', icon: <BookMarked size={20} /> },
        { label: 'Communication', href: '/admin/communication', icon: <MessageSquare size={20} /> },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Parents', href: '/admin/parents', icon: <Users2 size={20} /> },
        { label: 'Enquiries', href: '/admin/enquiries', icon: <HelpCircle size={20} /> },
        { label: 'Reports', href: '/admin/reports', icon: <BarChart3 size={20} /> },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
        { label: 'User Management', href: '/admin/users', icon: <Shield size={20} /> },
        { label: 'Activity Logs', href: '/admin/logs', icon: <ActivitySquare size={20} /> },
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

  const sidebarWidth = isCollapsed ? 76 : 268;
  const sidebarTransform = isDesktop || isMobileOpen ? 'translateX(0)' : 'translateX(-100%)';

  return (
    <>
      {!isDesktop && isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity"
          onClick={() => onMobileToggle(false)}
        />
      )}

      <aside
        className="fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-white/10 bg-linear-to-b from-[#0c0f1a] via-[#111827] to-[#0f172a] text-white shadow-2xl shadow-indigo-950/30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: `${sidebarWidth}px`,
          transform: sidebarTransform,
        }}
      >
        <div className="relative flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'w-full justify-center' : ''}`}>
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-lg shadow-indigo-500/40">
              <GraduationCap size={22} className="text-white" />
              <Sparkles
                size={12}
                className="absolute -right-0.5 -top-0.5 text-amber-300 animate-pulse-soft"
              />
            </div>
            {!isCollapsed && (
              <div>
                <span className="block text-lg font-bold tracking-tight">TuitionPro</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-300/80">
                  Admin
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => onToggleCollapse(true)}
              className="rounded-xl p-2 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={() => onToggleCollapse(false)}
              className="absolute -right-3 top-7 hidden rounded-full border border-white/20 bg-slate-800 p-1.5 text-slate-300 shadow-lg transition-all hover:bg-indigo-600 hover:text-white lg:flex"
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onMobileToggle(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                        transition-all duration-200 ease-out
                        ${active
                          ? 'bg-linear-to-r from-indigo-600 to-violet-600 text-white nav-active-glow'
                          : 'text-slate-400 hover:bg-white/8 hover:text-white'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
                      )}
                      <span
                        className={`shrink-0 transition-transform duration-200 ${!active && 'group-hover:scale-110'}`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge != null && item.badge > 0 && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div
            className={`mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 backdrop-blur-sm ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white ring-2 ring-white/20">
              A
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">Admin User</p>
                <p className="truncate text-xs text-indigo-300/70">Super Admin</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/15 hover:text-red-300 ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
