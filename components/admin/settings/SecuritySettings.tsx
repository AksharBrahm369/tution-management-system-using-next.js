"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import type { InstituteSettingsRecord } from "./types";

interface Props { settings: InstituteSettingsRecord; onSaved: () => void; }

export default function SecuritySettings({ settings, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to save security settings");
      onSaved();
    } finally { setSaving(false); }
  };

  const toggle = <K extends keyof InstituteSettingsRecord>(key: K) => setForm((current) => ({ ...current, [key]: !current[key] } as InstituteSettingsRecord));

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Security</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control password policy, sessions, and lockout behavior.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Minimum Length"><input type="number" value={form.passwordMinLength} onChange={(event) => setForm((current) => ({ ...current, passwordMinLength: Number(event.target.value) }))} className="input" /></Field>
        <Field label="Password Expiry (days)"><input type="number" value={form.passwordExpiryDays} onChange={(event) => setForm((current) => ({ ...current, passwordExpiryDays: Number(event.target.value) }))} className="input" /></Field>
        <Field label="Session Timeout (minutes)"><input type="number" value={form.sessionTimeoutMinutes} onChange={(event) => setForm((current) => ({ ...current, sessionTimeoutMinutes: Number(event.target.value) }))} className="input" /></Field>
        <Field label="Remember Me Duration (days)"><input type="number" value={form.rememberMeDays} onChange={(event) => setForm((current) => ({ ...current, rememberMeDays: Number(event.target.value) }))} className="input" /></Field>
        <Field label="Max Failed Attempts"><input type="number" value={form.maxFailedAttempts} onChange={(event) => setForm((current) => ({ ...current, maxFailedAttempts: Number(event.target.value) }))} className="input" /></Field>
        <Field label="Lockout Duration (minutes)"><input type="number" value={form.lockoutDurationMinutes} onChange={(event) => setForm((current) => ({ ...current, lockoutDurationMinutes: Number(event.target.value) }))} className="input" /></Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Toggle label="Require Uppercase" checked={form.requireUppercase} onChange={() => toggle("requireUppercase")} />
        <Toggle label="Require Number" checked={form.requireNumber} onChange={() => toggle("requireNumber")} />
        <Toggle label="Require Special Character" checked={form.requireSpecialChar} onChange={() => toggle("requireSpecialChar")} />
        <Toggle label="Enable 2FA (Coming Soon)" checked={form.twoFactorEnabled} onChange={() => toggle("twoFactorEnabled")} disabled />
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">Two Factor Authentication</p>
          <p className="text-sm text-slate-500">Future scope</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Coming Soon</span>
      </div>

      <div className="flex justify-end"><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"><ShieldCheck size={16} /> {saving ? "Saving..." : "Save Security"}</button></div>

      <style jsx>{`.input{width:100%;border-radius:0.75rem;border:1px solid rgb(203 213 225);background:transparent;padding:0.75rem 1rem;font-size:0.875rem;}`}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>{children}</div>; }
function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: () => void; disabled?: boolean }) { return <button type="button" disabled={disabled} onClick={onChange} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300 disabled:opacity-60"><span>{label}</span><span className={`h-5 w-10 rounded-full p-0.5 ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} /></span></button>; }