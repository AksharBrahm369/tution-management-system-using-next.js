import React from "react";
import { defaultGradeRanges } from "@/lib/gradeCalculator";
import { CreateExamForm } from "./CreateExamTypes";

export default function Step2MarksConfig({ form, onChange, onNext, onPrevious }: { form: CreateExamForm; onChange: (form: CreateExamForm) => void; onNext: () => void; onPrevious: () => void }) {
  const passingPercent = form.totalMarks ? ((form.passingMarks / form.totalMarks) * 100).toFixed(2) : "0";
  const set = <K extends keyof CreateExamForm>(key: K, value: CreateExamForm[K]) => onChange({ ...form, [key]: value });
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Marks Setup</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm"><span className="text-slate-500">Total Marks*</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={form.totalMarks} onChange={(e) => set("totalMarks", Number(e.target.value))} required aria-required="true" min={1} /></label>
        <label className="text-sm"><span className="text-slate-500">Passing Marks* ({passingPercent}%)</span><input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={form.passingMarks} onChange={(e) => set("passingMarks", Number(e.target.value))} required aria-required="true" min={0} /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.hasNegativeMarking} onChange={(e) => set("hasNegativeMarking", e.target.checked)} />Has Negative Marking</label>
      {form.hasNegativeMarking && <label className="mt-3 block text-sm"><span className="text-slate-500">Negative marks per wrong answer</span><input className="mt-1 w-full max-w-xs rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={form.negativeMarkValue} onChange={(e) => set("negativeMarkValue", Number(e.target.value))} /></label>}
      <h3 className="mt-6 font-semibold">Grading System</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">{["PERCENTAGE","GRADE_POINTS","MARKS","PASS_FAIL"].map((system) => <button key={system} className={`rounded-lg border px-3 py-2 text-sm ${form.gradingSystem === system ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}`} onClick={() => set("gradingSystem", system)}>{system.replace("_", " ")}</button>)}</div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">{defaultGradeRanges.map((range) => <div key={range.grade} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{range.grade}: {range.minPercentage}-{range.maxPercentage}%</div>)}</div>
      <div className="mt-6 flex justify-between"><button className="rounded-xl border px-5 py-2" onClick={onPrevious}>Previous</button><button className="rounded-xl bg-blue-600 px-5 py-2 text-white" onClick={onNext}>Next Step</button></div>
    </div>
  );
}
