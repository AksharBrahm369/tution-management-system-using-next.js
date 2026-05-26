"use client";

import ParentSectionPage from "@/components/parent/dashboard/ParentSectionPage";

export default function Page() {
  return (
    <ParentSectionPage
      title="Feedback"
      subtitle="Review and submit parent feedback to the institute."
      endpoint="/api/parent/feedback"
      itemsKey="feedback"
      renderItem={(item: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="font-semibold text-slate-900 dark:text-white">{item.subject}</div>
          <div className="mt-1 text-sm text-slate-500">{item.type} • {item.status}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</div>
        </div>
      )}
    />
  );
}
