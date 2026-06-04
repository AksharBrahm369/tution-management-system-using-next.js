"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock, CreditCard } from "lucide-react";

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/student/me");
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch student data");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8 text-slate-500">Loading your dashboard...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="text-lg font-semibold">Error</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const { student, summary } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {student.firstName}!</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {student.studentCode} | Year {student.academicYear}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Batch Info */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <BookOpen size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Current Batch</h2>
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {student.batchEnrollments?.length > 0 ? (
              student.batchEnrollments.map((enr: any) => (
                <div key={enr.id} className="mb-2">
                  <div className="font-medium text-slate-900 dark:text-white">{enr.batch.name}</div>
                  <div className="text-xs">{enr.batch.timing}</div>
                </div>
              ))
            ) : (
              <p>Not enrolled in any batch.</p>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Clock size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Attendance</h2>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary.attendancePercent ?? 0}%
            </div>
            <p className="mt-1 text-sm text-slate-500">Overall Attendance</p>
          </div>
        </div>

        {/* Fee Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <CreditCard size={24} />
            <h2 className="font-semibold text-slate-900 dark:text-white">Pending Fees</h2>
          </div>
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            {student.feeRecords?.length > 0 ? (
              student.feeRecords.map((fee: any) => (
                <div key={fee.id} className="mb-2 flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span>{fee.month} {fee.year}</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">₹{fee.amount}</span>
                </div>
              ))
            ) : (
              <p className="text-emerald-600 dark:text-emerald-400">All fees paid!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
