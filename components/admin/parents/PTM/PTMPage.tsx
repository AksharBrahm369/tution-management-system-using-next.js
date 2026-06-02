"use client";

import React, { useEffect, useState } from "react";

export default function PTMPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "February Parent Meeting", description: "", meetingDate: new Date().toISOString().slice(0, 10), startTime: "15:00", endTime: "18:00", venue: "Conference Room", isOnline: false, meetingLink: "", batchId: "", isForAll: true, slotDuration: 15, autoGenerateSlots: false });

  async function load() {
    const res = await fetch("/api/admin/parents/ptm", { credentials: "same-origin" });
    const data = await res.json();
    setMeetings(data.meetings ?? []);
  }

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/parents/ptm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule PTM");
      }

      setSuccess("PTM scheduled successfully");
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to schedule PTM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">PTM Meetings</h2>
        <p className="mt-2 text-sm text-slate-500">Schedule parent teacher meetings and manage slots.</p>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 md:grid-cols-2">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">{success}</div>}
        <input aria-label="PTM title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-2xl border px-4 py-3 dark:bg-slate-950" placeholder="Title" />
        <input aria-label="PTM meeting date" value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} type="date" required className="rounded-2xl border px-4 py-3 dark:bg-slate-950" />
        <input aria-label="PTM start time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} type="time" className="rounded-2xl border px-4 py-3 dark:bg-slate-950" />
        <input aria-label="PTM end time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} type="time" className="rounded-2xl border px-4 py-3 dark:bg-slate-950" />
        <input aria-label="PTM venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="rounded-2xl border px-4 py-3 dark:bg-slate-950" placeholder="Venue" />
        <input aria-label="PTM meeting link" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} className="rounded-2xl border px-4 py-3 dark:bg-slate-950" placeholder="Meeting link" />
        <button type="submit" disabled={loading} className="rounded-2xl bg-cyan-600 px-4 py-3 text-white md:col-span-2 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Scheduling..." : "Schedule PTM"}</button>
      </form>
      <div className="grid gap-4 lg:grid-cols-2">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{meeting.title}</div>
            <div className="mt-1 text-sm text-slate-500">{new Date(meeting.meetingDate).toLocaleDateString()} • {meeting.startTime} - {meeting.endTime}</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Slots: {meeting.slots?.length ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
