"use client";

import React, { useEffect, useState } from "react";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/parents/feedback", { credentials: "same-origin" });
    const data = await res.json();
    setFeedback(data.feedback ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Parent Feedback</h2>
        <p className="mt-2 text-sm text-slate-500">Review parent feedback, respond, and close the loop.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {feedback.map((item) => (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.type}</span>
              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">{item.status}</span>
            </div>
            <div className="mt-3 font-semibold text-slate-900 dark:text-white">{item.subject}</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
            <div className="mt-4 flex gap-2"><button className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">View & Respond</button><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">Close</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
