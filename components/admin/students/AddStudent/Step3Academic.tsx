import React from "react";
import { useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";

const Step3Academic: React.FC = () => {
  const { register } = useFormContext<StudentCreateInput>();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Academic Background</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input {...register("previousSchool")} placeholder="Previous School Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <input {...register("previousClass")} placeholder="Previous Class / Standard" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <input {...register("previousMarks")} placeholder="Previous Marks / Percentage" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <input type="date" {...register("joiningDate")} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <select {...register("category")} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="AVERAGE">Average</option><option value="WEAK">Weak</option><option value="GOOD">Good</option><option value="TOPPER">Topper</option></select>
        <input {...register("referredBy")} placeholder="Referred By" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        <textarea {...register("notes")} placeholder="Special Notes" rows={4} className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Batch Assignment</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected batches can be managed after student creation from the student profile.</p>
      </div>
    </div>
  );
};

export default Step3Academic;
