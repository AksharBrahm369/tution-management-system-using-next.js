"use client";

import ParentSectionPage from "@/components/parent/dashboard/ParentSectionPage";

export default function Page() {
  return (
    <ParentSectionPage
      title="Notice Board"
      subtitle="Recent notices and important updates for parents."
      endpoint="/api/parent/announcements"
      itemsKey="announcements"
      renderItem={(item: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
          <div className="mt-2 text-sm text-slate-500">{item.message}</div>
        </div>
      )}
    />
  );
}
