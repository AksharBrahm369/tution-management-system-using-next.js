import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";

const Step4Emergency: React.FC = () => {
  const { control, register } = useFormContext<StudentCreateInput>();
  const { fields, append } = useFieldArray({ control, name: "emergencyContacts" });

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Contacts</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Add at least one emergency contact.</p>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 md:grid-cols-3">
            <input {...register(`emergencyContacts.${index}.name` as const)} placeholder="Contact Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <input {...register(`emergencyContacts.${index}.relationship` as const)} placeholder="Relationship" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            <input {...register(`emergencyContacts.${index}.phone` as const)} placeholder="Phone Number" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>
        ))}
      </div>

      <button type="button" onClick={() => append({ name: "", relationship: "", phone: "" })} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
        + Add Another Contact
      </button>
    </div>
  );
};

export default Step4Emergency;
