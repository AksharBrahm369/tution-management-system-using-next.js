"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type StudentProfile = {
  firstName: string;
  lastName: string;
  studentCode: string;
  academicYear: string;
  email: string | null;
  phone: string | null;
  gender: string;
  status: string;
};

export default function StudentProfilePage() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/me", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setStudent(json.student);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-pulse">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-slate-300 dark:bg-slate-700" />
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800 last:border-0 last:pb-0">
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-24 rounded bg-slate-300 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
            <User size={48} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {student.firstName} {student.lastName}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {student.studentCode} | Year {student.academicYear}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500">Email</span>
            <span className="text-sm text-slate-900 dark:text-white">{student.email || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500">Phone</span>
            <span className="text-sm text-slate-900 dark:text-white">{student.phone || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-500">Gender</span>
            <span className="text-sm text-slate-900 dark:text-white">{student.gender}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-sm font-medium text-slate-500">Status</span>
            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {student.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
