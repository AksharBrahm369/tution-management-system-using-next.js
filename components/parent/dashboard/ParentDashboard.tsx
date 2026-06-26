"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
    return (
      <div className="space-y-5 animate-pulse">
        {/* Header Skeleton */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-64 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-16 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </section>

        {/* Quick Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-16 rounded bg-slate-300 dark:bg-slate-700" />
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Left card skeleton */}
          <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="h-6 w-48 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-32 rounded bg-slate-100 dark:bg-slate-800/40" />
              <div className="h-32 rounded bg-slate-100 dark:bg-slate-800/40" />
            </div>
          </div>

          {/* Right sidebar skeletons */}
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-40 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-40 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  const latestFee = selectedChild?.feeRecords?.[0];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Good morning, {data.parent?.fatherName || data.parent?.motherName || data.parent?.guardianName || "Parent"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">Parent Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Track attendance, fees, exams, notices, PTM, and messages for linked children.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Linked children</div>
            <div className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">{data.children.length}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{selectedChildName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a child to view their current summary.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.children.map((child, index) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildIndex(index)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    index === selectedChildIndex
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {child.firstName}
                </button>
              ))}
            </div>
          </div>

          {selectedChild ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-500 dark:text-slate-400">Today summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <div>Attendance today: {selectedChild.attendance?.[0]?.status ?? "N/A"}</div>
                  <div>Next class: {selectedChild.batchEnrollments?.[0]?.batch?.name ?? selectedChild.batchEnrollments?.[0]?.batch?.code ?? "Batch class"}</div>
                  <div>Upcoming exam: {selectedChild.examResults?.[0]?.exam?.title ?? "No exam scheduled"}</div>
                  <div>Fee due: {latestFee ? money(latestFee.pendingAmount) : "Rs. 0"}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="text-sm text-slate-500 dark:text-slate-400">Quick actions</div>
                <div className="mt-3 grid gap-2">
                  <Link className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white" href="/parent/fees">Pay fee online</Link>
                  <Link className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/messages">Message teacher</Link>
                  <Link className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/exams">View report card</Link>
                  <Link className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200" href="/parent/ptm">Book PTM slot</Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <Panel title="Notice Board" action={<Link href="/parent/announcements" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-300">View all</Link>}>
            {data.notices.slice(0, 3).map((notice) => (
              <div key={notice.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="font-medium text-slate-950 dark:text-white">{notice.title}</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{notice.message}</div>
              </div>
            ))}
          </Panel>

          <Panel title="PTM Meetings" action={<Link href="/parent/ptm" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-300">Open PTM</Link>}>
            {(data.ptmMeetings ?? []).slice(0, 4).map((meeting) => (
              <div key={meeting.id} className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="text-sm font-semibold text-slate-950 dark:text-white">{meeting.title}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(meeting.meetingDate).toLocaleDateString()} - {meeting.startTime} to {meeting.endTime}</div>
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">{meeting.slots?.length ? `${meeting.slots.length} booked slot(s)` : "Scheduled, waiting for slot booking"}</div>
              </div>
            ))}
            {!data.ptmMeetings?.length ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No PTM scheduled yet.
              </div>
            ) : null}
          </Panel>

          <Panel title="Upcoming Events" action={<CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />}>
            {data.upcomingEvents.map((event, index) => (
              <div key={`${event.title}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-4 dark:bg-slate-800/60">
                <div>
                  <div className="text-sm font-medium text-slate-950 dark:text-white">{event.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{event.type}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.date).toLocaleDateString()}</div>
              </div>
            ))}
            {(data.ptmMeetings ?? []).slice(0, 3).map((meeting) => (
              <div key={meeting.id} className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="text-sm font-medium text-slate-950 dark:text-white">{meeting.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">PTM scheduled for {new Date(meeting.meetingDate).toLocaleDateString()}</div>
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">{meeting.slots?.length ? `${meeting.slots.length} booked slot(s)` : "No slot booked yet"}</div>
              </div>
            ))}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-950 dark:text-white">{title}</h3>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
