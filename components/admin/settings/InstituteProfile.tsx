"use client";

import { useEffect, useMemo, useState } from "react";
import { Upload, Trash2, Eye } from "lucide-react";
import type { InstituteSettingsRecord } from "./types";

const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface Props {
  settings: InstituteSettingsRecord;
  onSaved: () => void;
}

export default function InstituteProfile({ settings, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const logoPreview = useMemo(() => form.logo || null, [form.logo]);

  const setValue = <K extends keyof InstituteSettingsRecord>(key: K, value: InstituteSettingsRecord[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleWorkingDay = (day: string) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day) ? current.workingDays.filter((item) => item !== day) : [...current.workingDays, day],
    }));
  };

  const uploadLogo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/settings/logo", { method: "POST", body: formData });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to upload logo");
    const payload = await response.json();
    setValue("logo", payload.logo);
    onSaved();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) await uploadLogo(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to save profile");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Institute Profile</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Update branding, contact details, address, and theme colors.</p>
        </div>
        <button type="button" aria-pressed={previewTheme} onClick={() => setPreviewTheme((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
          <Eye size={16} /> Preview Theme
        </button>
      </div>

      {previewTheme ? <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">Theme preview uses your primary and secondary colors across TuitionPro.</div> : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-950/40"
          >
            {logoPreview ? <img src={logoPreview} alt="Institute logo" className="mb-4 h-28 w-28 rounded-2xl object-contain" /> : <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-200 text-sm text-slate-500 dark:bg-slate-800">Logo</div>}
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop logo here</p>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG or SVG</p>
            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              <Upload size={16} /> Upload Logo
              <input aria-label="Upload institute logo" type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadLogo(event.target.files[0])} />
            </label>
            {form.logo ? <button type="button" onClick={() => setValue("logo", null)} className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400"><Trash2 size={14} /> Remove logo</button> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Institute Name*"><input value={form.name} onChange={(event) => setValue("name", event.target.value)} className="input" /></Field>
          <Field label="Tagline"><input value={form.tagline ?? ""} onChange={(event) => setValue("tagline", event.target.value)} className="input" /></Field>
          <Field label="Description" full><textarea value={form.description ?? ""} onChange={(event) => setValue("description", event.target.value)} className="input min-h-28" /></Field>
          <Field label="Primary Phone*"><input value={form.phone ?? ""} onChange={(event) => setValue("phone", event.target.value)} className="input" /></Field>
          <Field label="Secondary Phone"><input value={form.alternatePhone ?? ""} onChange={(event) => setValue("alternatePhone", event.target.value)} className="input" /></Field>
          <Field label="Email"><input value={form.email ?? ""} onChange={(event) => setValue("email", event.target.value)} className="input" /></Field>
          <Field label="Website URL"><input value={form.website ?? ""} onChange={(event) => setValue("website", event.target.value)} className="input" /></Field>
          <Field label="Address Line 1" full><input value={form.addressLine1 ?? ""} onChange={(event) => setValue("addressLine1", event.target.value)} className="input" /></Field>
          <Field label="Address Line 2" full><input value={form.addressLine2 ?? ""} onChange={(event) => setValue("addressLine2", event.target.value)} className="input" /></Field>
          <Field label="City"><input value={form.city ?? ""} onChange={(event) => setValue("city", event.target.value)} className="input" /></Field>
          <Field label="State"><input value={form.state ?? ""} onChange={(event) => setValue("state", event.target.value)} className="input" /></Field>
          <Field label="Pincode"><input value={form.pincode ?? ""} onChange={(event) => setValue("pincode", event.target.value)} className="input" /></Field>
          <Field label="Country"><input value={form.country} onChange={(event) => setValue("country", event.target.value)} className="input" /></Field>

          <div className="md:col-span-2 space-y-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Working Days</p>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => (
                <button key={day} type="button" aria-label={`Toggle ${day.toLowerCase()} as a working day`} aria-pressed={form.workingDays.includes(day)} onClick={() => toggleWorkingDay(day)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${form.workingDays.includes(day) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <Field label="Opening Time"><input value={form.workingHours?.openingTime ?? "09:00"} onChange={(event) => setValue("workingHours", { ...(form.workingHours ?? {}), openingTime: event.target.value })} className="input" type="time" /></Field>
          <Field label="Closing Time"><input value={form.workingHours?.closingTime ?? "18:00"} onChange={(event) => setValue("workingHours", { ...(form.workingHours ?? {}), closingTime: event.target.value })} className="input" type="time" /></Field>
          <Field label="Primary Color"><input value={form.primaryColor} onChange={(event) => setValue("primaryColor", event.target.value)} className="input h-12" type="color" /></Field>
          <Field label="Secondary Color"><input value={form.secondaryColor} onChange={(event) => setValue("secondaryColor", event.target.value)} className="input h-12" type="color" /></Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving..." : "Save Profile"}</button>
      </div>

      <style jsx>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgb(203 213 225); background: transparent; padding: 0.75rem 1rem; font-size: 0.875rem; }
        :global(.dark) .input { border-color: rgb(51 65 85); color: white; }
      `}</style>
    </section>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>{children}</div>;
}
