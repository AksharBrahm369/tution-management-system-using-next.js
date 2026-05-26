"use client";

import { useState } from "react";

const subjectOptions = ["Mathematics", "Science", "English", "Hindi", "Computer", "Commerce"];
const sourceOptions = ["WALK_IN", "PHONE_CALL", "WHATSAPP", "SOCIAL_MEDIA", "REFERRAL", "OTHER"];

export default function EnquiryForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [form, setForm] = useState({
    studentName: "",
    studentClass: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    interestedSubjects: [] as string[],
    sourceDetail: "",
    source: "WEBSITE",
  });

  const toggleSubject = (subject: string) => {
    setForm((current) => ({
      ...current,
      interestedSubjects: current.interestedSubjects.includes(subject)
        ? current.interestedSubjects.filter((item) => item !== subject)
        : [...current.interestedSubjects, subject],
    }));
  };

  const submit = async () => {
    setLoading(true);
    setStatusMessage("");
    setNoteMessage("");
    try {
      const response = await fetch("/api/public/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: form.studentName,
          studentClass: form.studentClass,
          parentName: form.parentName,
          parentPhone: form.parentPhone,
          parentEmail: form.parentEmail,
          interestedIn: form.interestedSubjects,
          sourceDetail: form.sourceDetail,
          notes: form.sourceDetail,
          source: form.source,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit enquiry");
      }

      setSubmitted(true);
      setStatusMessage(payload.message || "Thank you for your enquiry. We will contact you within 24 hours.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to submit enquiry");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">Thank you</h1>
        <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">{statusMessage}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">TuitionPro</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Enquiry Form</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tell us a little about your child and we will get back to you quickly.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input value={form.studentName} onChange={(event) => setForm((current) => ({ ...current, studentName: event.target.value }))} placeholder="Student Name*" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input value={form.studentClass} onChange={(event) => setForm((current) => ({ ...current, studentClass: event.target.value }))} placeholder="Current Class*" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input value={form.parentName} onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))} placeholder="Parent Name*" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input value={form.parentPhone} onChange={(event) => setForm((current) => ({ ...current, parentPhone: event.target.value }))} placeholder="Parent Phone*" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input value={form.parentEmail} onChange={(event) => setForm((current) => ({ ...current, parentEmail: event.target.value }))} placeholder="Parent Email" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
        <input value={form.sourceDetail} onChange={(event) => setForm((current) => ({ ...current, sourceDetail: event.target.value }))} placeholder="How did you hear about us?" className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Interested Subjects</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {subjectOptions.map((subject) => (
            <button key={subject} type="button" onClick={() => toggleSubject(subject)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${form.interestedSubjects.includes(subject) ? "bg-cyan-600 text-white" : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preferred source</label>
        <select value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className="rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white">
          {sourceOptions.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <textarea value={noteMessage} onChange={(event) => setNoteMessage(event.target.value)} placeholder="Message (optional)" className="min-h-28 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white" />

      {statusMessage && !submitted ? <div className="text-sm text-red-600 dark:text-red-300">{statusMessage}</div> : null}

      <div className="flex justify-end">
        <button onClick={submit} disabled={loading} className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Submitting..." : "Submit Enquiry"}</button>
      </div>
    </div>
  );
}
