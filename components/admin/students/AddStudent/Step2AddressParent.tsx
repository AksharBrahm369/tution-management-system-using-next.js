import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";

const Step2AddressParent: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<StudentCreateInput>();
  const [guardianOpen, setGuardianOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Home Address</h2>
        <div className="mt-4 grid gap-4">
          <input {...register("addressLine1")} placeholder="Address Line 1" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <input {...register("addressLine2")} placeholder="Address Line 2" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <div className="grid gap-4 md:grid-cols-2">
            <div><input {...register("city")} placeholder="City *" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}</div>
            <div><input {...register("state")} placeholder="State *" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}</div>
          </div>
          <input {...register("pincode")} placeholder="Pincode" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Parent / Guardian Details</h2>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2"><input {...register("fatherName")} placeholder="Father Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><div><input {...register("fatherPhone")} placeholder="Father Phone *" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.fatherPhone && <p className="mt-1 text-xs text-red-500">{errors.fatherPhone.message}</p>}</div></div>
          <div className="grid gap-4 md:grid-cols-2"><input {...register("fatherEmail")} placeholder="Father Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><input {...register("fatherOccup")} placeholder="Father Occupation" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>
          <div className="grid gap-4 md:grid-cols-2"><input {...register("motherName")} placeholder="Mother Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><input {...register("motherPhone")} placeholder="Mother Phone" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>
          <div className="grid gap-4 md:grid-cols-2"><input {...register("motherEmail")} placeholder="Mother Email" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><input {...register("motherOccup")} placeholder="Mother Occupation" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <button type="button" onClick={() => setGuardianOpen((value) => !value)} className="text-sm font-semibold text-blue-600">Different Guardian?</button>
            {guardianOpen && <div className="mt-4 grid gap-4 md:grid-cols-2"><input {...register("guardianName")} placeholder="Guardian Name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><input {...register("guardianPhone")} placeholder="Guardian Phone" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><input {...register("guardianRel")} placeholder="Relationship" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white md:col-span-2" /></div>}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Primary Contact</p>
            <div className="flex flex-wrap gap-4">
              {(["FATHER", "MOTHER", "GUARDIAN"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="radio" value={value} {...register("primaryContact")} /> {value}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2AddressParent;
