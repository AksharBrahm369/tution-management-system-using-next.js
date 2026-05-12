"use client";

/**
 * TuitionPro - Dashboard Layout (Client Component for logout)
 */

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useState } from "react";
import { LogOut, LayoutDashboard, ChevronRight } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </div>
          </div>

          <button
            id="logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <LoadingSpinner size="sm" label="Signing out..." />
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
