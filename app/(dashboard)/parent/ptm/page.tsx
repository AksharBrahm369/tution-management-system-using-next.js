"use client";

import ParentSectionPage from "@/components/parent/dashboard/ParentSectionPage";

export default function Page() {
  return (
    <ParentSectionPage
      title="PTM"
      subtitle="Book and view parent-teacher meeting slots."
      endpoint="/api/parent/ptm"
      itemsKey="ptmMeetings"
      renderItem={(item: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
          <div className="mt-1 text-sm text-slate-500">
            {new Date(item.meetingDate).toLocaleDateString()} • {item.slots?.length ? `${item.slots.length} booked slot(s)` : "No slot booked yet"}
          </div>
        </div>
      )}
    />
  );
}
