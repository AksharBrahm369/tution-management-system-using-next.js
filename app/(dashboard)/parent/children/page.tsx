"use client";

import ParentSectionPage from "@/components/parent/dashboard/ParentSectionPage";
import Link from "next/link";

export default function Page() {
  return (
    <ParentSectionPage
      title="My Children"
      subtitle="Review each child's current batch, attendance, exams, and fee status."
      endpoint="/api/parent/children"
      itemsKey="children"
      renderItem={(child: any) => (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{child.firstName} {child.lastName}</div>
          <div className="mt-1 text-sm text-slate-500">{child.studentCode}</div>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
            <div>Batch: {child.batchEnrollments?.[0]?.batch?.name || "-"}</div>
            <div>Attendance: {child.attendancePercent ?? 0}%</div>
            <div>Fee: {(child.feeRecords?.[0]?.status) || "-"}</div>
          </div>
          <Link href="/parent/dashboard" className="mt-4 inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">View Dashboard</Link>
        </div>
      )}
    />
  );
}
