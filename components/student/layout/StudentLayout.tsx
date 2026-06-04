"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LayoutDashboard, QrCode } from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/student/profile", icon: User },
    { name: "Scan QR", href: "/student/attendance/scan", icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16 md:pb-0">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-8">
          <Link href="/student/dashboard" className="text-xl font-bold text-cyan-600 dark:text-cyan-500">
            TuitionPro
          </Link>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${pathname === item.href ? "text-cyan-600 dark:text-cyan-500" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-center border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-10">
        <div className="text-lg font-bold text-cyan-600 dark:text-cyan-500">TuitionPro Student</div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? "text-cyan-600 dark:text-cyan-500" : "text-slate-500 dark:text-slate-400"}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
