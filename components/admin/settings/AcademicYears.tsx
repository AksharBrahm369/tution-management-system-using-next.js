"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import type { AcademicYearRecord } from "./types";

interface Props {
  currentAcademicYear: string;
  academicYears: AcademicYearRecord[];
  onChanged: () => void;
}

export default function AcademicYears({ currentAcademicYear, academicYears, onChanged }: Props) {
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", isCurrent: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm((current) => ({ ...current, isCurrent: false })), [academicYears]);

  const createYear = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to create academic year");
      setForm({ name: "", startDate: "", endDate: "", isCurrent: false });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (id: string) => {
    await fetch(`/api/admin/settings/academic-years/${id}/set-current`, { method: "PATCH" });
    onChanged();
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Academic Years</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage the institute calendar and current year.</p>
        </div>
        <div className="rounded-2xl bg-blue-600 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-100">Current Academic Year</p>
          <p className="text-lg font-semibold">{currentAcademicYear}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <input aria-label="Academic year name" placeholder="Year Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input aria-label="Academic year start date" type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input aria-label="Academic year end date" type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <button onClick={createYear} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
          <CalendarPlus size={16} /> {saving ? "Adding..." : "Add Year"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {academicYears.map((year) => (
              <tr key={year.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-4 py-3 font-medium">{year.name}</td>
                <td className="px-4 py-3">{new Date(year.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">{new Date(year.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${year.isCurrent ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : year.isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {year.isCurrent ? "Current" : year.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!year.isCurrent ? (
                    <button onClick={() => setCurrent(year.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"><Check size={14} /> Set Current</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
