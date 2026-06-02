"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, Plug } from "lucide-react";
import type { InstituteSettingsRecord } from "./types";

interface Props {
  settings: InstituteSettingsRecord;
  onSaved: () => void;
}

export default function FeeAndGST({ settings, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => setForm(settings), [settings]);

  const setValue = <K extends keyof InstituteSettingsRecord>(key: K, value: InstituteSettingsRecord[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to save fee settings");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    const response = await fetch("/api/admin/settings/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integration: "razorpay" }) });
    const payload = await response.json();
    setTestStatus(payload.message ?? payload.error ?? "No response");
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Fee & GST</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Configure taxation, receipts, and payment gateway preferences.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Toggle label="GST Enabled" checked={form.gstEnabled} onChange={(value) => setValue("gstEnabled", value)} />
        <Field label="GST Number"><input value={form.gstNumber ?? ""} onChange={(event) => setValue("gstNumber", event.target.value)} className="input" /></Field>
        <Field label="GST Percentage"><input type="number" value={form.gstPercentage} onChange={(event) => setValue("gstPercentage", Number(event.target.value))} className="input" /></Field>
        <Field label="PAN Number"><input value={form.panNumber ?? ""} onChange={(event) => setValue("panNumber", event.target.value)} className="input" /></Field>
        <Field label="Currency"><input value={form.currency} onChange={(event) => setValue("currency", event.target.value)} className="input" /></Field>
        <Field label="Receipt Prefix"><input value={form.receiptPrefix} onChange={(event) => setValue("receiptPrefix", event.target.value)} className="input" /></Field>
        <Field label="Starting Number"><input value={form.receiptStartNumber} onChange={(event) => setValue("receiptStartNumber", event.target.value)} className="input" /></Field>
        <Field label="Receipt Footer Text" full><input value={form.receiptFooterText ?? ""} onChange={(event) => setValue("receiptFooterText", event.target.value)} className="input" /></Field>
      </div>

      <div className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-blue-600" />
          <h4 className="font-semibold text-slate-900 dark:text-white">Razorpay Payment Gateway</h4>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Key ID"><input value={form.razorpayKeyId ?? ""} onChange={(event) => setValue("razorpayKeyId", event.target.value)} className="input" /></Field>
          <Field label="Key Secret"><input value={form.razorpayKeySecret ?? ""} onChange={(event) => setValue("razorpayKeySecret", event.target.value)} className="input" /></Field>
          <Field label="Mode"><select value={form.razorpayMode} onChange={(event) => setValue("razorpayMode", event.target.value)} className="input"><option value="TEST">Test</option><option value="LIVE">Live</option></select></Field>
          <div className="flex items-end gap-3">
        <button type="button" onClick={testConnection} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"><Plug size={16} /> Test Connection</button>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.razorpayKeyId ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{settings.razorpayKeyId ? "Connected" : "Not Connected"}</span>
          </div>
        </div>
        {testStatus ? <p className="mt-3 text-sm text-slate-500">{testStatus}</p> : null}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? "Saving..." : "Save Fee Settings"}</button>
      </div>

      <style jsx>{`.input{width:100%;border-radius:0.75rem;border:1px solid rgb(203 213 225);background:transparent;padding:0.75rem 1rem;font-size:0.875rem;}`}</style>
    </section>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
      <span>{label}</span>
      <input aria-label={label} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>{children}</div>;
}
