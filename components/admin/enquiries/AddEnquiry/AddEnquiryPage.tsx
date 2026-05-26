"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const sourceOptions = [
  "WALK_IN",
  "PHONE_CALL",
  "WHATSAPP",
  "WEBSITE",
  "SOCIAL_MEDIA",
  "REFERRAL",
  "NEWSPAPER",
  "PAMPHLET",
  "OTHER",
] as const;

const priorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export default function AddEnquiryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    studentName: "",
    studentAge: "",
    studentClass: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: "",
    interestedIn: "",
    preferredBatch: "",
    preferredTime: "",
    source: "WALK_IN",
    sourceDetail: "",
    referredBy: "",
    priority: "NORMAL",
    assignedTo: "",
    notes: "",
    followUpScheduledAt: "",
    followUpType: "CALL",
  });

  const interestedItems = useMemo(() => form.interestedIn.split(",").map((item) => item.trim()).filter(Boolean), [form.interestedIn]);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    setFormError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studentName: form.studentName,
          studentAge: form.studentAge ? Number(form.studentAge) : undefined,
          studentClass: form.studentClass,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          parentEmail: form.parentEmail,
          address: form.address,
          interestedIn: interestedItems,
          preferredBatch: form.preferredBatch,
          preferredTime: form.preferredTime,
          source: form.source,
          sourceDetail: form.sourceDetail,
          referredBy: form.referredBy,
          priority: form.priority,
          assignedTo: form.assignedTo,
          notes: form.notes,
          followUpScheduledAt: followUpEnabled ? form.followUpScheduledAt : undefined,
          followUpType: form.followUpType,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload.issues) {
          setFieldErrors(payload.issues.fieldErrors ?? {});
          const firstField = Object.values(payload.issues.fieldErrors ?? {}).flat().find(Boolean);
          throw new Error(firstField || payload.error || "Failed to create enquiry");
        }

        throw new Error(payload.error || "Failed to create enquiry");
      }

      const payload = await response.json();
      router.push(`/admin/enquiries/${payload.enquiry.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create enquiry");
      alert(error instanceof Error ? error.message : "Failed to create enquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add Enquiry</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Register a walk-in or phone enquiry and optionally schedule a follow-up.</p>
      </div>

      {formError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          {formError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["studentName", "Student Name*"],
          ["studentAge", "Student Age"],
          ["studentClass", "Current Class/Standard"],
          ["parentName", "Parent Name*"],
          ["parentPhone", "Parent Phone*"],
          ["parentEmail", "Parent Email"],
          ["address", "Address"],
          ["interestedIn", "Interested In (comma separated)"],
          ["preferredBatch", "Preferred Batch"],
          ["preferredTime", "Preferred Timing"],
          ["sourceDetail", "Source Details"],
          ["referredBy", "Referred By"],
          ["assignedTo", "Assign To"],
          ["notes", "Notes"],
        ].map(([field, label]) => (
          <div key={field} className={field === "notes" || field === "address" || field === "interestedIn" ? "md:col-span-2" : ""}>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            {field === "address" || field === "notes" ? (
              <textarea value={form[field as keyof typeof form]} onChange={(event) => handleChange(field, event.target.value)} className="min-h-24 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
            ) : (
              <input
                value={form[field as keyof typeof form]}
                onChange={(event) => handleChange(field, event.target.value)}
                type={field === "studentAge" ? "number" : field === "parentPhone" ? "tel" : "text"}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white"
              />
            )}
            {fieldErrors[field]?.length ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{fieldErrors[field][0]}</p> : null}
          </div>
        ))}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Source*</label>
          <select value={form.source} onChange={(event) => handleChange("source", event.target.value)} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
            {sourceOptions.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
          <select value={form.priority} onChange={(event) => handleChange("priority", event.target.value)} className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
            {priorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={followUpEnabled} onChange={(event) => setFollowUpEnabled(event.target.checked)} />
          Schedule follow-up immediately
        </label>
        {followUpEnabled ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <select value={form.followUpType} onChange={(event) => handleChange("followUpType", event.target.value)} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
              <option value="CALL">Call</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="VISIT">Visit</option>
            </select>
            <input value={form.followUpScheduledAt} onChange={(event) => handleChange("followUpScheduledAt", event.target.value)} type="datetime-local" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
        <button onClick={submit} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{loading ? "Saving..." : "Create Enquiry"}</button>
      </div>
    </div>
  );
}
