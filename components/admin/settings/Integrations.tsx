"use client";

import { useEffect, useState } from "react";
import { PlugZap, MessageCircle, Cloud, RefreshCcw } from "lucide-react";
import type { InstituteSettingsRecord, SettingsApiResponse } from "./types";

interface Props {
  settings: InstituteSettingsRecord;
  integrations: SettingsApiResponse["integrations"];
  onSaved: () => void;
}

export default function Integrations({ settings, integrations, onSaved }: Props) {
  const [form, setForm] = useState(settings);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => setForm(settings), [settings]);

  const save = async () => {
    const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Failed to save integrations");
    onSaved();
  };

  const test = async (integration: "twilio" | "razorpay") => {
    const response = await fetch("/api/admin/settings/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integration }) });
    const payload = await response.json();
    setStatus(payload.message ?? payload.error ?? "No response");
  };

  const card = (title: string, icon: React.ReactNode, connected: boolean, body: React.ReactNode) => (
    <div className="rounded-3xl border border-slate-200 p-5 dark:border-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-slate-100 p-3 text-blue-600 dark:bg-slate-800">{icon}</span>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
            <p className="text-xs text-slate-500">{connected ? "Connected" : "Not Connected"}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{connected ? "Connected" : "Not Connected"}</span>
      </div>
      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">{body}</div>
    </div>
  );

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Integrations</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage external service credentials and connectivity checks.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {card("Twilio", <MessageCircle size={18} />, integrations.twilio.connected, <div className="space-y-3"><p>Account SID: {integrations.twilio.maskedAccountSid ?? "Not configured"}</p><p>WhatsApp Number: {form.twilioWhatsAppNumber ?? "Not configured"}</p><button onClick={() => test("twilio")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Test SMS</button></div>)}
        {card("Cloudinary", <Cloud size={18} />, integrations.cloudinary.connected, <div className="space-y-3"><p>Cloud Name: {integrations.cloudinary.cloudName ?? "Not configured"}</p><button onClick={save} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Edit Credentials</button></div>)}
        {card("Firebase", <PlugZap size={18} />, integrations.firebase.connected, <div className="space-y-3"><p>Project ID: {integrations.firebase.projectId ?? "Not configured"}</p><button onClick={save} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Edit Credentials</button></div>)}
        {card("Razorpay", <RefreshCcw size={18} />, integrations.razorpay.connected, <div className="space-y-3"><p>Mode: {form.razorpayMode}</p><button onClick={() => test("razorpay")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Test Connection</button></div>)}
      </div>

      {status ? <p className="text-sm text-slate-500">{status}</p> : null}
    </section>
  );
}