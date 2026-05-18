"use client";

import React, { useState } from "react";
import { defaultGradeRanges } from "@/lib/gradeCalculator";

export default function GradeConfigModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Default Grade Configuration");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/grade-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isDefault: true, grades: defaultGradeRanges }),
      });
      if (!response.ok) throw new Error("Failed to save grade config");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Grade Settings</h2><button onClick={onClose}>Close</button></div>
        <label className="mt-4 block text-sm"><span className="text-slate-500">Name</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <div className="mt-4 grid gap-2">
          {defaultGradeRanges.map((range) => <div key={range.grade} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">{range.grade}: {range.minPercentage}-{range.maxPercentage}% | GP {range.gradePoint} | {range.remark}</div>)}
        </div>
        <div className="mt-6 flex justify-end gap-2"><button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-white" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save Default"}</button></div>
      </div>
    </div>
  );
}
