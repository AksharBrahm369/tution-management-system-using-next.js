"use client";

import ParentNavbar from "./ParentNavbar";
import ParentSidebar from "./ParentSidebar";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        <ParentSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ParentNavbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
