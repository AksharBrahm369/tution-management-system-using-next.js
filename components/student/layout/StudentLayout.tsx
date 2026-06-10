"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, LayoutDashboard, ShieldAlert, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<"UNAUTHORIZED" | "FORBIDDEN" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogInAsStudent = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      window.location.href = "/student/login";
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
        if (loggedUser && loggedUser.role === "STUDENT") {
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
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/student/profile", icon: User },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <ShieldAlert size={28} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {authError === "UNAUTHORIZED" ? "Access Restricted" : "Role Access Denied"}
            </h3>
            
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {authError === "UNAUTHORIZED" ? (
                "You are not currently logged in. Please log in with your student credentials to view this dashboard."
              ) : (
                "You are currently logged in with a non-student account. To access this portal, please log in with a Student account."
              )}
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              Need student access? Contact your administrator to get credentials.
            </div>

            <div className="mt-6 flex flex-col gap-2.5 w-full">
              <button
                onClick={handleLogInAsStudent}
                disabled={loggingOut}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-75"
              >
                {loggingOut ? "Signing out..." : "Log In as Student"}
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
          {pathname !== "/student/dashboard" && (
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
              title="Go Back"
              type="button"
            >
              <ArrowLeft size={14} />
            </button>
          )}
          <Link href="/student/dashboard" className="text-xl font-semibold text-blue-700 dark:text-blue-300">
            TuitionPro
          </Link>
          <nav className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium ${pathname === item.href ? "text-blue-700 dark:text-blue-300" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-10">
        <div className="flex w-9 items-center justify-start">
          {pathname !== "/student/dashboard" && (
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title="Go Back"
              type="button"
            >
              <ArrowLeft size={14} />
            </button>
          )}
        </div>
        <div className="text-base font-semibold text-blue-700 dark:text-blue-300">TuitionPro Student</div>
        <div className="w-9" />
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
              className={`flex flex-col items-center gap-1 ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
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
