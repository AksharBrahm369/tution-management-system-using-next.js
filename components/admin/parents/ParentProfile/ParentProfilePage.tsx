"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const tabs = ["Overview", "Children", "Fee Summary", "Communication", "PTM History", "Feedback"] as const;

type Props = { parentId: string };

export default function ParentProfilePage({ parentId }: Props) {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  async function load() {
    const response = await fetch(`/api/admin/parents/${parentId}`, { credentials: "same-origin" });
    const json = await response.json();
    setData(json.parent ?? null);
  }

  useEffect(() => {
    load();
  }, [parentId]);

  const children = data?.students ?? [];

  const feeSummary = useMemo(() => {
    return children.flatMap((student: any) => (student.feeRecords ?? []).map((fee: any) => ({ ...fee, student })));
  }, [children]);

  if (!data) return <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Loading parent profile...</div>;

  const displayName = data.fatherName || data.motherName || data.guardianName || "Parent";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{displayName}</h1>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">Primary contact</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{data.fatherPhone || data.motherPhone || data.guardianPhone || "-"} • {data.user?.email || data.fatherEmail || data.motherEmail || "-"}</p>
            <p className="mt-1 text-xs text-slate-400">Last login: {data.user?.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : "Never"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Send Message</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Call</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Reset Password</button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === tab ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="font-semibold text-slate-900 dark:text-white">Parent details</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div>Father: {data.fatherName || "-"}</div>
              <div>Mother: {data.motherName || "-"}</div>
              <div>Guardian: {data.guardianName || "-"}</div>
              <div>Primary contact: {data.primaryContact}</div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="font-semibold text-slate-900 dark:text-white">Login account</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div>Email: {data.user?.email || "Not created"}</div>
              <div>Last login: {data.user?.lastLogin ? new Date(data.user.lastLogin).toLocaleString() : "Never"}</div>
              <div>Account created: {data.user?.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : "-"}</div>
              <div className="flex gap-2"><button className="rounded-xl bg-cyan-600 px-4 py-2 text-white">Reset password</button><button className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-700">Disable account</button></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Children" && (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child: any) => (
            <div key={child.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{child.firstName} {child.lastName}</div>
              <div className="mt-1 text-sm text-slate-500">{child.studentCode}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
                <div>Attendance: {child.attendancePercent ?? 0}%</div>
                <div>Fee: {(child.feeRecords?.[0]?.status) || "-"}</div>
                <div>Last Exam: {(child.examResults?.[0]?.grade) || "-"}</div>
                <div>Batch: {child.batchEnrollments?.[0]?.batch?.name || child.batchEnrollments?.[0]?.batch?.code || "-"}</div>
              </div>
              <Link href={`/admin/students/${child.id}`} className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">View Full Profile</Link>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Fee Summary" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Combined fee summary</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500 dark:text-slate-400"><tr><th className="py-2">Child</th><th>Batch</th><th>Month</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {feeSummary.map((fee: any) => (
                  <tr key={fee.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-3">{fee.student.firstName} {fee.student.lastName}</td>
                    <td>{fee.batch?.name || "-"}</td>
                    <td>{fee.month}/{fee.year}</td>
                    <td>{fee.status}</td>
                    <td>₹{fee.pendingAmount?.toFixed?.(0) ?? fee.pendingAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Communication" && (
        <div className="space-y-3">
          {data.userId ? data.communication?.map?.((item: any) => null) : null}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="text-sm text-slate-500">Use the message center to view and send notices related to this parent.</div>
          </div>
        </div>
      )}

      {activeTab === "PTM History" && (
        <div className="space-y-3">
          {data.ptmSlots.map((slot: any) => (
            <div key={slot.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="font-semibold text-slate-900 dark:text-white">{slot.meeting?.title}</div>
              <div className="mt-1 text-sm text-slate-500">{new Date(slot.meeting?.meetingDate).toLocaleString()} • {slot.slotTime}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Teacher: {slot.teacher?.name || "-"}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Notes: {slot.notes || "-"}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Feedback" && (
        <div className="space-y-3">
          {data.feedbacks.map((item: any) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-slate-900 dark:text-white">{item.subject}</div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.type}</span>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              <div className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
