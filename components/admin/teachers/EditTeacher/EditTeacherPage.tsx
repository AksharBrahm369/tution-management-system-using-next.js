'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, CheckCircle2, BookOpen, 
  Briefcase, Edit
} from 'lucide-react';
import Link from 'next/link';
import { teacherSchema } from '@/lib/validations/teacher';

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function EditTeacherPage({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");
  const [subjectsRetryKey, setSubjectsRetryKey] = useState(0);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      employmentType: 'FULL_TIME',
      salaryType: 'FIXED',
      subjectIds: [],
    }
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setSubjectsLoading(true);
      setSubjectsError("");

      try {
        const [subjectsRes, teacherRes] = await Promise.all([
          fetch('/api/admin/subjects?active=true', { credentials: 'include' }),
          fetch(`/api/admin/teachers/${teacherId}`, { credentials: 'include' }),
        ]);

        if (subjectsRes.status === 401 || teacherRes.status === 401) {
          router.push('/auth/login');
          return;
        }

        const subjectsPayload = await subjectsRes.json().catch(() => ({}));
        const teacherPayload = await teacherRes.json().catch(() => ({}));
        const teacherData = teacherPayload as {
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
          gender?: TeacherFormValues["gender"];
          employmentType?: TeacherFormValues["employmentType"];
          salaryType?: TeacherFormValues["salaryType"];
          fixedSalary?: number;
          perClassRate?: number;
          subjects?: Array<{ subjectId: string }>;
        };

        if (!subjectsRes.ok) {
          throw new Error(subjectsPayload.error || 'Failed to load subjects');
        }

        if (!teacherRes.ok) {
          throw new Error(teacherPayload.error || 'Failed to load teacher');
        }

        setSubjects(Array.isArray(subjectsPayload?.subjects) ? subjectsPayload.subjects : []);
        form.reset({
          firstName: teacherData.firstName || '',
          lastName: teacherData.lastName || '',
          email: teacherData.email || '',
          phone: teacherData.phone || '',
          gender: teacherData.gender || 'MALE',
          employmentType: teacherData.employmentType || 'FULL_TIME',
          salaryType: teacherData.salaryType || 'FIXED',
          fixedSalary: teacherData.fixedSalary || undefined,
          perClassRate: teacherData.perClassRate || undefined,
          subjectIds: teacherData.subjects?.map((subject) => subject.subjectId) || [],
        });
      } catch (err: unknown) {
        console.error("Failed to load data", err);
        setSubjects([]);
        setSubjectsError(err instanceof Error ? err.message : "Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
        setLoading(false);
      }
    };

    loadData();
  }, [teacherId, form, router, subjectsRetryKey]);

  const onSubmit = async (data: TeacherFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        alert(payload.error || "Failed to update teacher");
        return;
      }

      router.push(`/admin/teachers/${teacherId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;
  const currentSubjectIds = watch('subjectIds') || [];

  const toggleSubject = (id: string) => {
    if (currentSubjectIds.includes(id)) {
      setValue('subjectIds', currentSubjectIds.filter(s => s !== id), { shouldValidate: true });
    } else {
      setValue('subjectIds', [...currentSubjectIds, id], { shouldValidate: true });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/admin/teachers/${teacherId}`}>
          <button type="button" aria-label="Back to profile" className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit className="h-7 w-7 text-primary" />
            Edit Teacher Profile
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Update the profile and employment details of the teacher</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Basic Info Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Edit className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name <span className="text-red-500">*</span></label>
              <input id="firstName" type="text" {...register("firstName")} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name <span className="text-red-500">*</span></label>
              <input id="lastName" type="text" {...register("lastName")} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address <span className="text-red-500">*</span></label>
              <input id="email" type="email" {...register("email")} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
              <input id="phone" type="text" {...register("phone")} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender <span className="text-red-500">*</span></label>
              <select 
                id="gender" 
                {...register("gender")} 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subjects Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Subject Assignments</h2>
              <p className="text-xs text-slate-500">Select at least one subject. The first selected will be marked as primary.</p>
            </div>
          </div>
          
          {errors.subjectIds && <p className="text-red-500 text-sm mb-4">{errors.subjectIds.message}</p>}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {subjects.map(subject => {
              const isSelected = currentSubjectIds.includes(subject.id);
              const isPrimary = currentSubjectIds[0] === subject.id;
              
              return (
                <button
                  type="button"
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? 'Remove' : 'Select'} ${subject.name} subject`}
                  className={`
                    cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center gap-2
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                  `}
                >
                  <div className={`h-4 w-4 rounded-full border ${isSelected ? 'border-4 border-primary' : 'border-slate-300'} transition-all`}></div>
                  <div>
                    <p className={`font-medium ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                      {subject.name}
                    </p>
                    {isPrimary && <span className="text-[10px] uppercase font-bold text-primary tracking-wider mt-1 block">Primary</span>}
                  </div>
                </button>
              );
            })}
            {subjectsLoading && <p className="text-sm text-slate-500 col-span-full py-4 text-center">Loading subjects...</p>}
            {!subjectsLoading && subjectsError && (
              <div className="col-span-full flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm text-red-500">{subjectsError}</p>
                <button
                  type="button"
                  onClick={() => setSubjectsRetryKey((value) => value + 1)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Retry Loading Subjects
                </button>
              </div>
            )}
            {!subjectsLoading && !subjectsError && subjects.length === 0 && (
              <p className="text-sm text-slate-500 col-span-full py-4 text-center">No active subjects found. Please create a subject first.</p>
            )}
          </div>
        </div>

        {/* Professional & Salary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Employment & Compensation</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="employmentType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Employment Type</label>
              <select 
                id="employmentType" 
                {...register("employmentType")} 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="VISITING">Visiting Faculty</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="salaryType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Salary Structure</label>
              <select 
                id="salaryType" 
                {...register("salaryType")} 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
              >
                <option value="FIXED">Fixed Monthly</option>
                <option value="PER_CLASS">Per Class/Hour</option>
                <option value="PER_STUDENT">Per Student</option>
              </select>
            </div>

            {watch('salaryType') === 'FIXED' && (
              <div className="space-y-2">
                <label htmlFor="fixedSalary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fixed Monthly Salary (₹)</label>
                <input id="fixedSalary" type="number" {...register("fixedSalary", { valueAsNumber: true })} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              </div>
            )}

            {watch('salaryType') === 'PER_CLASS' && (
              <div className="space-y-2">
                <label htmlFor="perClassRate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rate Per Class (₹)</label>
                <input id="perClassRate" type="number" {...register("perClassRate", { valueAsNumber: true })} className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-900/50 dark:border-slate-800" />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button 
            type="button" 
            className="mr-4 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 font-medium text-sm"
            onClick={() => router.push(`/admin/teachers/${teacherId}`)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 min-w-[150px] font-medium text-sm flex justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
