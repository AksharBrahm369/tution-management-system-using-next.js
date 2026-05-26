"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, CalendarDays, CreditCard, LayoutDashboard, MessageSquare, Megaphone, Users, UserCheck } from "lucide-react";

const links = [
  { href: "/parent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/parent/children", label: "My Children", icon: Users },
  { href: "/parent/attendance", label: "Attendance", icon: UserCheck },
  { href: "/parent/fees", label: "Fees & Payments", icon: CreditCard },
  { href: "/parent/exams", label: "Exams & Results", icon: BookOpen },
  { href: "/parent/announcements", label: "Announcements", icon: Megaphone },
  { href: "/parent/messages", label: "Messages", icon: MessageSquare },
  { href: "/parent/notices", label: "Notice Board", icon: Bell },
  { href: "/parent/ptm", label: "PTM", icon: CalendarDays },
];

export default function ParentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/95 px-4 py-5 text-slate-100 lg:flex lg:flex-col">
      <div className="mb-6 px-2">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">TuitionPro</div>
        <div className="mt-1 text-2xl font-semibold">Parent Portal</div>
        <p className="mt-2 text-sm text-slate-400">Track children, PTM, fees, and communication.</p>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${active ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
