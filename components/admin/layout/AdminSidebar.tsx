"use client"

import React from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
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
  Layers3,
  ChevronDown,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: Array<{ label: string; href: string }>;
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
  const [standards, setStandards] = React.useState<Array<{ id: string; name: string }>>([])
  const [standardsOpen, setStandardsOpen] = React.useState(false)

  React.useEffect(() => {
    let mounted = true

    const loadStandards = async () => {
      try {
        const response = await fetch("/api/admin/standards")
        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as {
          standards?: Array<{ id: string; name: string }>
        }

        if (mounted) {
          setStandards(payload.standards ?? [])
        }
      } catch {
        if (mounted) {
          setStandards([])
        }
      }
    }

    void loadStandards()
    window.addEventListener("tuitionpro:standards-changed", loadStandards)

    return () => {
      mounted = false
      window.removeEventListener("tuitionpro:standards-changed", loadStandards)
    }
  }, [])

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
        {
          label: "Standards",
          href: "/admin/standards",
          icon: <Layers3 size={20} />,
          children: [
            { label: "All Standards", href: "/admin/standards" },
            ...standards.map((standard) => ({
              label: standard.name,
              href: `/admin/standards/${standard.id}`,
            })),
          ],
        },
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
    <Sidebar className="border-r border-white/10 bg-slate-950 text-white shadow-none">
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-white/10 py-3">
        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="block text-base font-semibold tracking-normal text-white">TuitionPro</span>
            <span className="text-[11px] font-medium text-slate-400">
              Admin
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center w-full group-data-[collapsible=icon]:flex hidden">
          <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg text-white/70 hover:bg-white/10 hover:text-white" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden pr-2">
          <SidebarTrigger className="h-9 w-9 shrink-0 rounded-lg text-white/70 hover:bg-white/10 hover:text-white" />
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-3 px-2 py-4">
        {navSections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-500">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  const hasChildren = Boolean(item.children?.length)

                  if (hasChildren) {
                    return (
                      <SidebarMenuItem key={item.href}>
                        <Collapsible.Root open={standardsOpen} onOpenChange={setStandardsOpen}>
                          <Collapsible.Trigger asChild>
                            <SidebarMenuButton
                              isActive={active}
                              tooltip={item.label}
                              className="cursor-pointer"
                            >
                              {item.icon}
                              <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                              <ChevronDown
                                size={16}
                                className={`ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden ${standardsOpen ? "rotate-180" : ""}`}
                              />
                            </SidebarMenuButton>
                          </Collapsible.Trigger>

                          <Collapsible.Content>
                            <SidebarMenuSub>
                              {item.children?.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                    <Link href={child.href}>{child.label}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </SidebarMenuItem>
                    )
                  }

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
                          <span className="ml-auto rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white group-data-[collapsible=icon]:hidden">
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

      <SidebarFooter className="space-y-2 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-semibold text-white ring-1 ring-white/10">
            {initials}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300 group-data-[collapsible=icon]:justify-center"
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
