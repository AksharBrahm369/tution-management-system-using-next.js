"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<"UNAUTHORIZED" | "FORBIDDEN" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogInAsTeacher = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/auth/login";
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) {
            setAuthError("UNAUTHORIZED");
          } else {
            setAuthError("FORBIDDEN");
          }
          return;
        }
        const data = await res.json();
        const loggedUser = data.data?.user;
        if (loggedUser && loggedUser.role === "TEACHER") {
          setAuthError(null);
        } else {
          setAuthError("FORBIDDEN");
        }
      } catch (err) {
        setAuthError("UNAUTHORIZED");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname]);

  const navItems = [
    { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-sm font-medium">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-center shadow-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400 mb-4 shadow-inner animate-pulse">
              <ShieldAlert size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {authError === "UNAUTHORIZED" ? "Access Restricted" : "Role Access Denied"}
            </h3>
            
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {authError === "UNAUTHORIZED" ? (
                "You are not currently logged in. Please log in with your teacher credentials to view this dashboard."
              ) : (
                "You are currently logged in with a non-teacher account. To access this portal, please log in with a Teacher account."
              )}
            </p>

            <div className="mt-4 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/85">
              Need teacher access? Contact your administrator to get credentials.
            </div>

            <div className="mt-6 flex flex-col gap-2.5 w-full">
              <button
                onClick={handleLogInAsTeacher}
                disabled={loggingOut}
                className="flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-75"
              >
                {loggingOut ? "Signing out..." : "Log In as Teacher"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-16 md:pb-0">
      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-8">
          <Link href="/teacher/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-500">
            TuitionPro Teacher
          </Link>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${pathname === item.href ? "text-indigo-600 dark:text-indigo-500" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-center border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-10">
        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-500">TuitionPro Teacher</div>
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
              className={`flex flex-col items-center gap-1 ${isActive ? "text-indigo-600 dark:text-indigo-500" : "text-slate-500 dark:text-slate-400"}`}
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
