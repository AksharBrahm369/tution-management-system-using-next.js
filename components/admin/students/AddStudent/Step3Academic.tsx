import React from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { StudentCreateInput } from "@/lib/validations/student";

const Step3Academic: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<StudentCreateInput>();
  const { data: standardsData } = useQuery<{ standards: Array<{ id: string; name: string }> }>({
    queryKey: ["admin-standards-options"],
    queryFn: async () => {
      const response = await fetch("/api/admin/standards");
      if (!response.ok) throw new Error("Failed to load standards");
      return response.json();
    },
  });
  const standards = standardsData?.standards ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Academic Background</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Standard</label>
          <select {...register("standardId")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <option value="">Select Standard</option>
            {standards.map((standard) => (
              <option key={standard.id} value={standard.id}>{standard.name}</option>
            ))}
          </select>
          {errors.standardId && <p className="text-red-500 text-[10px]">{errors.standardId.message}</p>}
        </div>
        <div className="space-y-1">
          <input {...register("previousSchool")} placeholder="Previous School Name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.previousSchool && <p className="text-red-500 text-[10px]">{errors.previousSchool.message}</p>}
        </div>
        <div className="space-y-1">
          <input {...register("previousClass")} placeholder="Previous Class / Standard" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.previousClass && <p className="text-red-500 text-[10px]">{errors.previousClass.message}</p>}
        </div>
        <div className="space-y-1">
          <input {...register("previousMarks")} placeholder="Previous Marks / Percentage" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.previousMarks && <p className="text-red-500 text-[10px]">{errors.previousMarks.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Joining Date</label>
          <input type="date" {...register("joiningDate")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.joiningDate && <p className="text-red-500 text-[10px]">{errors.joiningDate.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Student Category</label>
          <select {...register("category")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="AVERAGE">Average</option><option value="WEAK">Weak</option><option value="GOOD">Good</option><option value="TOPPER">Topper</option></select>
          {errors.category && <p className="text-red-500 text-[10px]">{errors.category.message}</p>}
        </div>
        <div className="space-y-1">
          <input {...register("referredBy")} placeholder="Referred By" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.referredBy && <p className="text-red-500 text-[10px]">{errors.referredBy.message}</p>}
        </div>
        <div className="md:col-span-2 space-y-1">
          <textarea {...register("notes")} placeholder="Special Notes" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          {errors.notes && <p className="text-red-500 text-[10px]">{errors.notes.message}</p>}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Batch Assignment</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Selected batches can be managed after student creation from the student profile.</p>
      </div>
    </div>
  );
};

export default Step3Academic;
