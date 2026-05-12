import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";

interface Step1BasicInfoProps {
  generatedCode: string;
  isEditMode?: boolean;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ generatedCode, isEditMode }) => {
  const { register, formState: { errors }, setValue, watch } = useFormContext<StudentCreateInput>();

  useEffect(() => {
    if (!isEditMode && generatedCode) {
      setValue("studentCode", generatedCode);
    }
  }, [generatedCode, isEditMode, setValue]);

  const fileValue = watch("profilePhoto");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Enter student personal details</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</span><input {...register("firstName")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}</label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</span><input {...register("lastName")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}</label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span><input type="email" {...register("email")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</span><input {...register("phone")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth</span><input type="date" {...register("dateOfBirth")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender *</span><select {...register("gender")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Blood Group</span><select {...register("bloodGroup")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Select blood group</option><option value="A_POSITIVE">A+</option><option value="A_NEGATIVE">A-</option><option value="B_POSITIVE">B+</option><option value="B_NEGATIVE">B-</option><option value="AB_POSITIVE">AB+</option><option value="AB_NEGATIVE">AB-</option><option value="O_POSITIVE">O+</option><option value="O_NEGATIVE">O-</option></select></label>
        <label className="space-y-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Academic Year *</span><input {...register("academicYear")} placeholder="2025-26" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{errors.academicYear && <p className="text-xs text-red-500">{errors.academicYear.message}</p>}</label>
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Student Code</span><input {...register("studentCode")} readOnly className="w-full rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm text-slate-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200" /></label>
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo URL</span><input {...register("profilePhoto")} placeholder="https://..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />{fileValue && <div className="mt-3 flex items-center gap-3"><img src={fileValue} alt="preview" className="h-16 w-16 rounded-xl object-cover" /><span className="text-xs text-slate-500">Preview</span></div>}</label>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
