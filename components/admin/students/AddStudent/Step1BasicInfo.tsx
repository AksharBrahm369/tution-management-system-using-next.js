import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { StudentCreateInput } from "@/lib/validations/student";
import { Upload, Trash2 } from "lucide-react";

interface Step1BasicInfoProps {
  generatedCode: string;
  isEditMode?: boolean;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ generatedCode, isEditMode }) => {
  const { register, formState: { errors }, setValue, watch } = useFormContext<StudentCreateInput>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isEditMode && generatedCode) {
      setValue("studentCode", generatedCode);
    }
  }, [generatedCode, isEditMode, setValue]);

  const fileValue = watch("profilePhoto");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      if (data.url) {
        setValue("profilePhoto", data.url, { shouldValidate: true });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

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
        <div className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Photo</span>
          <div className="flex items-center gap-4">
            {fileValue ? (
              <div className="relative group">
                <img src={fileValue} alt="profile" className="h-24 w-24 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
                <button
                  type="button"
                  onClick={() => setValue("profilePhoto", "", { shouldValidate: true })}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40">
                <Upload size={20} className="mb-1 text-slate-400" />
                <span className="text-[10px]">Upload</span>
              </div>
            )}
            <div className="flex-1 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Upload a square image for best results. Supported formats: JPG, PNG, GIF.</p>
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload size={16} /> {uploading ? "Uploading..." : "Choose Image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
