import React, { useState } from "react";
import { BatchOption, SubjectOption } from "../types";
import { CreateExamForm } from "./CreateExamTypes";

export default function Step1ExamDetails({ form, batches, subjects, onChange, onNext }: { form: CreateExamForm; batches: BatchOption[]; subjects: SubjectOption[]; onChange: (form: CreateExamForm) => void; onNext: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof CreateExamForm>(key: K, value: CreateExamForm[K]) => onChange({ ...form, [key]: value });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title || String(form.title).trim().length === 0) e.title = "Title is required";
    if (!form.batchId || String(form.batchId).trim().length === 0) e.batchId = "Select a batch";
    if (!form.subjectId || String(form.subjectId).trim().length === 0) e.subjectId = "Select a subject";
    if (!form.academicYear || String(form.academicYear).trim().length === 0) e.academicYear = "Academic year is required";
    if (!form.examDate || String(form.examDate).trim().length === 0) e.examDate = "Exam date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Exam Details</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm"><span className="text-slate-500">Exam Title*</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.title} onChange={(e) => set("title", e.target.value)} />{errors.title && <div className="text-sm text-red-600 mt-1">{errors.title}</div>}</label>
        <label className="text-sm"><span className="text-slate-500">Exam Code</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Auto generated" value={form.code} onChange={(e) => set("code", e.target.value)} /></label>
        <label className="text-sm"><span className="text-slate-500">Exam Type*</span><select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.type} onChange={(e) => set("type", e.target.value)}>{["UNIT_TEST","MID_TERM","FINAL","MOCK_TEST","CLASS_TEST","ASSIGNMENT","PRACTICAL","ONLINE_TEST"].map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}</select></label>
        <label className="text-sm"><span className="text-slate-500">Batch*</span><select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.batchId} onChange={(e) => { const batch = batches.find((item) => item.id === e.target.value); onChange({ ...form, batchId: e.target.value, subjectId: batch?.subjectId ?? form.subjectId }); }}><option value="">Select batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select>{errors.batchId && <div className="text-sm text-red-600 mt-1">{errors.batchId}</div>}</label>
        <label className="text-sm"><span className="text-slate-500">Subject*</span><select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.subjectId} onChange={(e) => set("subjectId", e.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>{errors.subjectId && <div className="text-sm text-red-600 mt-1">{errors.subjectId}</div>}</label>
        <label className="text-sm"><span className="text-slate-500">Academic Year*</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.academicYear} onChange={(e) => set("academicYear", e.target.value)} /></label>
        <label className="text-sm"><span className="text-slate-500">Exam Date*</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="date" value={form.examDate} onChange={(e) => set("examDate", e.target.value)} />{errors.examDate && <div className="text-sm text-red-600 mt-1">{errors.examDate}</div>}</label>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-sm"><span className="text-slate-500">Start</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} /></label>
          <label className="text-sm"><span className="text-slate-500">End</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} /></label>
          <label className="text-sm"><span className="text-slate-500">Duration</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} /></label>
        </div>
        <label className="md:col-span-2 text-sm"><span className="text-slate-500">Description</span><textarea className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={form.description} onChange={(e) => set("description", e.target.value)} /></label>
      </div>
      <div className="mt-6 flex justify-end"><button className="rounded-xl bg-blue-600 px-5 py-2 text-white" onClick={handleNext}>Next Step</button></div>
    </div>
  );
}
