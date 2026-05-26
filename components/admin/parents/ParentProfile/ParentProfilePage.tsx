"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const tabs = ["Overview", "Children", "Fee Summary", "Communication", "PTM History", "Feedback"] as const;

type Props = { parentId: string };

function formatTeacherName(teacher?: { firstName?: string | null; lastName?: string | null } | null) {
  if (!teacher) return "-";
  return `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || "-";
}

export default function ParentProfilePage({ parentId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/parents/${parentId}`, { credentials: "same-origin" });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || "Failed to load parent profile");
      }

      if (!json.parent) {
        throw new Error("Parent profile not found");
      }

      setData(json.parent);
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load parent profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [parentId]);

  const children = data?.students ?? [];

  const feeSummary = useMemo(() => {
    return children.flatMap((student: any) => (student.feeRecords ?? []).map((fee: any) => ({ ...fee, student })));
  }, [children]);

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Loading parent profile...</div>;

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        <div className="text-lg font-semibold">Unable to load parent profile</div>
        <div className="mt-2 text-sm">{error}</div>
      </div>
    );
  }

  if (!data) return <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Parent profile not found.</div>;

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
          {data.communication?.length > 0 ? (
            data.communication.map((item: any) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.kind}</span>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
                <div className="mt-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">No communication history found for this parent.</div>
          )}
        </div>
      )}

      {activeTab === "PTM History" && (
        <div className="space-y-3">
          {data.ptmMeetings?.length > 0 ? (
            data.ptmMeetings.map((meeting: any) => (
              <div key={meeting.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-900 dark:text-white">{meeting.title}</div>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">{meeting.status}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">{new Date(meeting.meetingDate).toLocaleString()} • {meeting.isOnline ? "Online" : meeting.venue || "Venue not set"}</div>
                {meeting.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{meeting.description}</p> : null}
                <div className="mt-3 space-y-3">
                  {meeting.slots?.length > 0 ? meeting.slots.map((slot: any) => (
                    <div key={slot.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{slot.slotTime} for {slot.student ? `${slot.student.firstName} ${slot.student.lastName}`.trim() : "student"}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Teacher: {formatTeacherName(slot.teacher)}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Notes: {slot.notes || "-"}</div>
                      {slot.parentFeedback ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">Parent feedback: {slot.parentFeedback}</div> : null}
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">No booked slot yet for this parent.</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">No PTM meetings found for this parent.</div>
          )}
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
