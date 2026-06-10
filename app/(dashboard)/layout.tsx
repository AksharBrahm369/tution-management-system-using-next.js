"use client";

import { useRouter, usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useState } from "react";
import { LogOut, LayoutDashboard, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isStudentRoute = pathname?.startsWith("/student");
  const logoutRedirectPath = isStudentRoute ? "/student/login" : "/auth/login";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(logoutRedirectPath);
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-mesh-bg min-h-screen">
        <header className="tp-glass sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              {!pathname.endsWith('/dashboard') && pathname !== '/student' && pathname !== '/parent' && pathname !== '/teacher' && (
                <button
                  onClick={() => router.back()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
                  title="Go Back"
                  type="button"
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                Dashboard
              </div>
            </div>

            <Button
              id="logout-button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950/30"
            >
              {isLoggingOut ? (
                <LoadingSpinner size="sm" label="Signing out..." />
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </header>

        <main className="page-enter mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
