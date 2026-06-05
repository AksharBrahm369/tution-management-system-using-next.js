"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Save } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { studentCreateSchema, StudentCreateInput } from "@/lib/validations/student";
import StepProgress from "./StepProgress";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2AddressParent from "./Step2AddressParent";
import Step3Academic from "./Step3Academic";
import Step4Emergency from "./Step4Emergency";
import Step5Review from "./Step5Review";

interface AddStudentPageProps {
  studentId?: string;
}

type StudentApiResponse = {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  bloodGroup: StudentCreateInput["bloodGroup"] | null;
  profilePhoto: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  previousSchool: string | null;
  previousClass: string | null;
  previousMarks: string | null;
  joiningDate: string;
  academicYear: string;
  status: StudentCreateInput["status"];
  category: StudentCreateInput["category"];
  referredBy: string | null;
  parent: {
    fatherName: string | null;
    fatherPhone: string | null;
    fatherEmail: string | null;
    fatherOccup: string | null;
    motherName: string | null;
    motherPhone: string | null;
    motherEmail: string | null;
    motherOccup: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianRel: string | null;
    primaryContact: StudentCreateInput["primaryContact"];
  } | null;
  batchEnrollments: Array<{ batchId: string; isActive: boolean }>;
  emergencyContacts: Array<{ name: string; relationship: string; phone: string }>;
  medicalInfo: {
    allergies: string | null;
    medications: string | null;
    conditions: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    insuranceInfo: string | null;
    extraNotes: string | null;
  } | null;
  siblings: Array<{ siblingId: string }>;
};

const emptyContact = { name: "", relationship: "", phone: "" };

function buildDefaultValues(student?: StudentApiResponse | null): StudentCreateInput {
  return {
    firstName: student?.firstName ?? "",
    lastName: student?.lastName ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
    gender: student?.gender ?? "MALE",
    bloodGroup: student?.bloodGroup ?? undefined,
    academicYear: student?.academicYear ?? "2025-26",
    profilePhoto: student?.profilePhoto ?? "",
    studentCode: student?.studentCode ?? "",
    addressLine1: student?.addressLine1 ?? "",
    addressLine2: student?.addressLine2 ?? "",
    city: student?.city ?? "",
    state: student?.state ?? "",
    pincode: student?.pincode ?? "",
    fatherName: student?.parent?.fatherName ?? "",
    fatherPhone: student?.parent?.fatherPhone ?? "",
    fatherEmail: student?.parent?.fatherEmail ?? "",
    fatherOccup: student?.parent?.fatherOccup ?? "",
    motherName: student?.parent?.motherName ?? "",
    motherPhone: student?.parent?.motherPhone ?? "",
    motherEmail: student?.parent?.motherEmail ?? "",
    motherOccup: student?.parent?.motherOccup ?? "",
    guardianName: student?.parent?.guardianName ?? "",
    guardianPhone: student?.parent?.guardianPhone ?? "",
    guardianRel: student?.parent?.guardianRel ?? "",
    primaryContact: student?.parent?.primaryContact ?? "FATHER",
    previousSchool: student?.previousSchool ?? "",
    previousClass: student?.previousClass ?? "",
    previousMarks: student?.previousMarks ?? "",
    joiningDate: student?.joiningDate ? new Date(student.joiningDate) : new Date(),
    category: student?.category ?? "AVERAGE",
    referredBy: student?.referredBy ?? "",
    batchIds: student?.batchEnrollments?.filter((enrollment) => enrollment.isActive).map((enrollment) => enrollment.batchId) ?? [],
    notes: "",
    emergencyContacts: student?.emergencyContacts?.length
      ? student.emergencyContacts.map((contact) => ({
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
        }))
      : [emptyContact],
    addMedicalInfo: Boolean(student?.medicalInfo),
    allergies: student?.medicalInfo?.allergies ?? "",
    medications: student?.medicalInfo?.medications ?? "",
    conditions: student?.medicalInfo?.conditions ?? "",
    doctorName: student?.medicalInfo?.doctorName ?? "",
    doctorPhone: student?.medicalInfo?.doctorPhone ?? "",
    insuranceInfo: student?.medicalInfo?.insuranceInfo ?? "",
    extraNotes: student?.medicalInfo?.extraNotes ?? "",
    siblingIds: student?.siblings?.map((link) => link.siblingId) ?? [],
    status: student?.status ?? "ACTIVE",
    createStudentLogin: false,
    createParentLogin: false,
  };
}

const AddStudentPage: React.FC<AddStudentPageProps> = ({ studentId }) => {
  const router = useRouter();
  const isEditMode = Boolean(studentId);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successStudent, setSuccessStudent] = useState<{ id: string; code: string; name: string } | null>(null);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email Address",
      phone: "Phone Number",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      bloodGroup: "Blood Group",
      academicYear: "Academic Year",
      profilePhoto: "Profile Photo",
      addressLine1: "Address Line 1",
      addressLine2: "Address Line 2",
      city: "City",
      state: "State",
      pincode: "Pincode",
      fatherName: "Father's Name",
      fatherPhone: "Father's Phone",
      fatherEmail: "Father's Email",
      fatherOccup: "Father's Occupation",
      motherName: "Mother's Name",
      motherPhone: "Mother's Phone",
      motherEmail: "Mother's Email",
      motherOccup: "Mother's Occupation",
      guardianName: "Guardian's Name",
      guardianPhone: "Guardian's Phone",
      guardianRel: "Guardian Relationship",
      primaryContact: "Primary Contact",
      previousSchool: "Previous School",
      previousClass: "Previous Class",
      previousMarks: "Previous Marks",
      joiningDate: "Joining Date",
      category: "Category",
      referredBy: "Referred By",
      batchIds: "Batches",
      notes: "Notes",
      emergencyContacts: "Emergency Contacts",
      allergies: "Allergies",
      medications: "Medications",
      conditions: "Medical Conditions",
      doctorName: "Doctor's Name",
      doctorPhone: "Doctor's Phone",
      insuranceInfo: "Insurance Info",
      extraNotes: "Medical Extra Notes",
      siblingIds: "Siblings",
      status: "Status",
      studentCode: "Student Code",
    };
    return labels[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  const { data: codeData, refetch: refetchGeneratedCode } = useQuery({
    queryKey: ["admin-student-code", studentId ?? "new"],
    queryFn: async () => {
      const response = await fetch("/api/admin/students/generate-code", { credentials: "include" });
      if (!response.ok) {
        return { code: "" };
      }
      return (await response.json()) as { code: string };
    },
    enabled: !isEditMode,
  });

  const {
    data: existingStudent,
    isLoading: isStudentLoading,
    error: studentError,
    refetch,
  } = useQuery({
    queryKey: ["admin-students", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}`, { credentials: "include" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          // session expired
          router.push("/auth/login");
          throw new Error(payload.error ?? "Unauthorized: Please log in again.");
        }
        throw new Error(payload.error ?? "Failed to load student");
      }
      return (await response.json()) as StudentApiResponse;
    },
    enabled: isEditMode,
  });

  const form = useForm<z.input<typeof studentCreateSchema>, any, z.output<typeof studentCreateSchema>>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: buildDefaultValues(null),
  });

  useEffect(() => {
    if (existingStudent) {
      form.reset(buildDefaultValues(existingStudent) as never);
    }
  }, [existingStudent, form]);

  const watchedStudentCode = String(form.watch("studentCode") ?? "");
  const generatedCode: string = isEditMode
    ? existingStudent?.studentCode ?? watchedStudentCode ?? ""
    : codeData?.code ?? watchedStudentCode ?? "";

  const stepFields: Record<number, (keyof StudentCreateInput)[]> = {
    1: ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender", "bloodGroup", "academicYear", "profilePhoto"],
    2: ["addressLine1", "addressLine2", "city", "state", "pincode", "fatherName", "fatherPhone", "fatherEmail", "fatherOccup", "motherName", "motherPhone", "motherEmail", "motherOccup", "guardianName", "guardianPhone", "guardianRel", "primaryContact"],
    3: ["previousSchool", "previousClass", "previousMarks", "joiningDate", "category", "referredBy", "batchIds", "notes"],
    4: ["emergencyContacts", "addMedicalInfo", "allergies", "medications", "conditions", "doctorName", "doctorPhone", "insuranceInfo", "extraNotes", "siblingIds"],
    5: ["createStudentLogin", "createParentLogin", "status", "studentCode"],
  };

  const onNext = async () => {
    const fieldsToValidate = stepFields[step];
    const valid = await form.trigger(fieldsToValidate);
    if (valid) {
      setStep((current) => Math.min(current + 1, 5));
    } else {
      const errors = form.formState.errors;
      const errorList = fieldsToValidate
        .filter((field) => errors[field])
        .map((field) => {
          const err = errors[field];
          const label = getFieldLabel(String(field));
          if (Array.isArray(err)) {
            return { field: label, message: "Validation failed in emergency contacts list" };
          }
          return { field: label, message: (err as any)?.message || "Invalid value" };
        });
        
      toast.error(
        <div className="flex flex-col gap-1 text-left">
          <span className="font-bold text-sm">Please fix the following validation errors:</span>
          <div className="text-xs space-y-1 mt-0.5 max-w-xs">
            {errorList.map((err, idx) => (
              <div key={idx} className="flex gap-1 items-start">
                <span className="shrink-0">•</span>
                <span>
                  <strong className="font-semibold text-rose-600 dark:text-rose-400">{err.field}:</strong> {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const onPrevious = () => setStep((current) => Math.max(current - 1, 1));

  const onSubmit = form.handleSubmit(
    async (values) => {
      console.log("🚀 FORM SUBMIT STARTED - onSubmit called");
      console.log("📋 Form values:", values);
      setIsSubmitting(true);
      try {
        const url = isEditMode ? `/api/admin/students/${studentId}` : "/api/admin/students";
        const method = isEditMode ? "PUT" : "POST";
        console.log(`📤 Sending ${method} request to ${url}`);
        
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
          credentials: "include",
        });

        console.log(`📥 Response received - Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error("❌ API Error Response:", payload);
          if (response.status === 401) {
            // Session expired or unauthorized - redirect to login
            router.push("/auth/login");
            throw new Error(payload.error ?? "Unauthorized: Please log in again.");
          }
          throw new Error(payload.error ?? "Failed to save student");
        }

        const payload = await response.json();
        console.log("✅ Student created/updated successfully:", payload);
        const student = payload.student as { id: string; studentCode: string; firstName: string; lastName: string };

        if (isEditMode) {
          router.push(`/admin/students/${studentId}`);
          router.refresh();
          return;
        }

        setSuccessStudent({ id: student.id, code: student.studentCode, name: `${student.firstName} ${student.lastName}` });
        form.reset(buildDefaultValues(null) as never);
        setStep(1);
        await refetchGeneratedCode();
      } catch (error) {
        console.error("🔴 Submit error:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save student");
      } finally {
        setIsSubmitting(false);
      }
    },
    (errors) => {
      console.error("❌ Form validation failed:", errors);
      const errorList = Object.entries(errors).map(([field, err]) => {
        const label = getFieldLabel(field);
        return { field: label, message: (err as any)?.message || "Invalid value" };
      });
      
      toast.error(
        <div className="flex flex-col gap-1 text-left">
          <span className="font-bold text-sm">Please fix the following validation errors:</span>
          <div className="text-xs space-y-1 mt-0.5 max-w-xs">
            {errorList.map((err, idx) => (
              <div key={idx} className="flex gap-1 items-start">
                <span className="shrink-0">•</span>
                <span>
                  <strong className="font-semibold text-rose-600 dark:text-rose-400">{err.field}:</strong> {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>,
        { duration: 5000 }
      );
    }
  );

  if (isEditMode && isStudentLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (studentError instanceof Error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {studentError.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href="/admin/students" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeft size={16} /> Back to Students
          </Link>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{isEditMode ? "Edit Student" : "Add New Student"}</h2>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{generatedCode ? `Student Code: ${generatedCode}` : "Auto generated student code"}</div>
      </div>

      <StepProgress currentStep={step} totalSteps={5} />

      <FormProvider {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          {step === 1 && <Step1BasicInfo generatedCode={generatedCode} isEditMode={isEditMode} />}
          {step === 2 && <Step2AddressParent />}
          {step === 3 && <Step3Academic />}
          {step === 4 && <Step4Emergency />}
          {step === 5 && <Step5Review />}

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
            <div>{step < 5 && <p className="text-sm text-slate-500 dark:text-slate-400">Complete the current step to continue.</p>}</div>
            <div className="flex flex-wrap items-center gap-3">
              {step > 1 && (
                <button type="button" onClick={onPrevious} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                  Previous
                </button>
              )}
              {step < 5 ? (
                <button type="button" onClick={onNext} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
                  Next Step
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSubmitting ? (isEditMode ? "Updating student..." : "Adding student...") : isEditMode ? "Update Student" : "Add Student"}
                </button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>

      {successStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="text-emerald-500" size={56} />
              <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Student Added!</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">{successStudent.name}</p>
              <p className="text-sm font-semibold text-blue-600">{successStudent.code}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={`/admin/students/${successStudent.id}`} className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white">
                View Profile
              </Link>
              <button onClick={() => setSuccessStudent(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Add Another Student
              </button>
              <Link href="/admin/students" className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Go to Students List
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStudentPage;
