"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  ActivitySquare,
  LogOut,
  Sparkles,
} from "lucide-react"

import type { CurrentAdminUser } from "@/lib/adminAuth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar"

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
  user: CurrentAdminUser;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user }) => {
  const pathname = usePathname()
  const router = useRouter()

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
        { label: "Students", href: "/admin/students", icon: <Users size={20} /> },
        { label: "Teachers", href: "/admin/teachers", icon: <GraduationCap size={20} /> },
        { label: "Batches", href: "/admin/batches", icon: <BookOpen size={20} /> },
        { label: "Attendance", href: "/admin/attendance", icon: <CheckCircle size={20} /> },
        { label: "Fees", href: "/admin/fees", icon: <Banknote size={20} /> },
        { label: "Exams & Results", href: "/admin/exams", icon: <FileText size={20} /> },
        { label: "Study Material", href: "/admin/materials", icon: <BookMarked size={20} /> },
        { label: "Communication", href: "/admin/communication", icon: <MessageSquare size={20} /> },
      ],
    },
    {
      title: "Management",
      items: [
        { label: "Parents", href: "/admin/parents", icon: <Users2 size={20} /> },
        { label: "Enquiries", href: "/admin/enquiries", icon: <HelpCircle size={20} /> },
        { label: "Reports", href: "/admin/reports", icon: <BarChart3 size={20} /> },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Settings", href: "/admin/settings", icon: <Settings size={20} /> },
        { label: "Activity Logs", href: "/admin/logs", icon: <ActivitySquare size={20} /> },
      ],
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        router.push("/auth/login")
        router.refresh()
      }
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const initials =
    user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") ||
    user.email[0]?.toUpperCase() ||
    "A"

  return (
    <Sidebar className="border-r border-white/10 bg-gradient-to-b from-[#0c0f1a] via-[#111827] to-[#0f172a] text-white shadow-2xl shadow-indigo-950/30">
      <SidebarHeader className="border-b border-white/10 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 shadow-lg shadow-indigo-500/40">
            <GraduationCap size={22} className="text-white" />
            <Sparkles
              size={12}
              className="absolute -right-0.5 -top-0.5 text-amber-300 animate-pulse-soft"
            />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="block text-lg font-bold tracking-tight text-white">TuitionPro</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-300/80">
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center w-full group-data-[collapsible=icon]:flex hidden">
          <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 shrink-0" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden pr-2">
          <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-5 space-y-4">
        {navSections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        asChild
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          {item.icon}
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                          {item.badge != null && item.badge > 0 && (
                            <span className="group-data-[collapsible=icon]:hidden rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white ml-auto">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 backdrop-blur-sm group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-sm font-bold text-white ring-2 ring-white/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-indigo-300/70">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/15 hover:text-red-300 group-data-[collapsible=icon]:justify-center"
          title="Logout"
        >
          <LogOut size={20} />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AdminSidebar
