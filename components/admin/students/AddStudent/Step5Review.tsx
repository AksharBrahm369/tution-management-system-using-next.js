import React from "react";
import { useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";

const Step5Review: React.FC = () => {
  const { watch, register } = useFormContext<StudentCreateInput>();
  const values = watch();

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Student Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Check the details before submitting.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { title: "Basic Info", content: `${values.firstName ?? ""} ${values.lastName ?? ""}` },
          { title: "Address", content: `${values.city ?? ""}, ${values.state ?? ""}` },
          { title: "Parent", content: values.fatherName ?? "" },
          { title: "Academic", content: `${values.academicYear ?? ""} / ${values.category ?? ""}` },
          { title: "Emergency Contacts", content: `${values.emergencyContacts?.length ?? 0} contact(s)` },
          { title: "Medical", content: values.addMedicalInfo ? "Included" : "Not added" },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.title}</p>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">{item.content || "-"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <input type="checkbox" {...register("createStudentLogin")} />
          <span className="text-sm text-slate-700 dark:text-slate-300">Create login account for student?</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <input type="checkbox" {...register("createParentLogin")} />
          <span className="text-sm text-slate-700 dark:text-slate-300">Create login account for parent?</span>
        </label>
      </div>
    </div>
  );
};

export default Step5Review;
