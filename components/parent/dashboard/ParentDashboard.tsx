"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, MessageSquare, School, TrendingUp, BadgeIndianRupee, BookOpen, Bell, ChevronRight } from "lucide-react";
import Link from "next/link";

type DashboardData = {
  parent: any;
  children: any[];
  notices: any[];
  ptmSlots: any[];
  ptmMeetings?: any[];
  feeRecords: any[];
  upcomingEvents: Array<{ type: string; title: string; date: string }>;
  stats: { attendance: number; unreadMessages: number };
};

function money(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

export default function ParentDashboard() {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["parent-dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/parent/dashboard", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Failed to load parent dashboard");
      return response.json();
    },
  });

  const selectedChild = data?.children?.[selectedChildIndex];
  const selectedChildName = selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : "Your child";

  const quickStats = useMemo(() => {
    if (!selectedChild) return [];
    const latestFee = selectedChild.feeRecords?.[0];
    const latestExam = selectedChild.examResults?.[0];
    const latestAttendance = selectedChild.attendance?.[0];

    return [
      { label: "Attendance", value: latestAttendance?.status ?? "-" },
      { label: "Fee Status", value: latestFee?.status ?? "-" },
      { label: "Last Exam", value: latestExam?.grade ?? latestExam?.percentage ?? "-" },
      { label: "Rank in Batch", value: selectedChild.rank ?? "-" },
    ];
  }, [selectedChild]);

  if (isLoading || !data) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">Loading parent dashboard...</div>;
  }

  const latestFee = selectedChild?.feeRecords?.[0];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-linear-to-br from-cyan-600 via-sky-600 to-indigo-700 p-6 text-white shadow-xl shadow-cyan-600/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/80">Good morning, {data.parent?.fatherName || data.parent?.motherName || data.parent?.guardianName || "Parent"}!</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Parent Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">Keep track of your children&apos;s attendance, fees, exams, announcements, PTM, and feedback in one place.</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-white/80">Linked children</div>
            <div className="text-2xl font-semibold tabular-nums">{data.children.length}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="text-sm text-slate-500">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedChildName}</h2>
              <p className="text-sm text-slate-500">Select a child to view their current summary.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.children.map((child, index) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildIndex(index)}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${index === selectedChildIndex ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  {child.firstName}
                </button>
              ))}
            </div>
          </div>

          {selectedChild ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-500">Today summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <div>Attendance today: {selectedChild.attendance?.[0]?.status ?? "N/A"}</div>
                  <div>Next class: {selectedChild.batchEnrollments?.[0]?.batch?.name ?? selectedChild.batchEnrollments?.[0]?.batch?.code ?? "Batch class"}</div>
                  <div>Upcoming exam: {selectedChild.examResults?.[0]?.exam?.title ?? "No exam scheduled"}</div>
                  <div>Fee due: {latestFee ? money(latestFee.pendingAmount) : "₹0"}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-500">Quick actions</div>
                <div className="mt-3 grid gap-2">
                  <Link className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white" href="/parent/fees">Pay fee online</Link>
                  <Link className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/messages">Message teacher</Link>
                  <Link className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/exams">View report card</Link>
                  <Link className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/ptm">Book PTM slot</Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notice Board</h3>
              <Link href="/parent/announcements" className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400">View all</Link>
            </div>
            <div className="mt-4 space-y-3">
              {data.notices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="font-medium text-slate-900 dark:text-white">{notice.title}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{notice.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">PTM Meetings</h3>
              <Link href="/parent/ptm" className="text-sm font-medium text-cyan-600 hover:underline dark:text-cyan-400">Open PTM</Link>
            </div>
            <div className="mt-4 space-y-3">
              {(data.ptmMeetings ?? []).slice(0, 4).map((meeting) => (
                <div key={meeting.id} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{meeting.title}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(meeting.meetingDate).toLocaleDateString()} • {meeting.startTime} - {meeting.endTime}</div>
                  <div className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">{meeting.slots?.length ? `${meeting.slots.length} booked slot(s)` : "Scheduled, waiting for slot booking"}</div>
                </div>
              ))}
              {!data.ptmMeetings?.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No PTM scheduled yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Events</h3>
              <CalendarDays className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="mt-4 space-y-3">
              {data.upcomingEvents.map((event, index) => (
                <div key={`${event.title}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{event.type}</div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.date).toLocaleDateString()}</div>
                </div>
              ))}
              {(data.ptmMeetings ?? []).slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{meeting.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">PTM scheduled for {new Date(meeting.meetingDate).toLocaleDateString()}</div>
                  <div className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">{meeting.slots?.length ? `${meeting.slots.length} booked slot(s)` : "No slot booked yet"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
