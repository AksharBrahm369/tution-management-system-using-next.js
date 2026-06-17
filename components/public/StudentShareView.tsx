"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { 
  CalendarDays, 
  CreditCard, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar,
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";
import type { PublicStudentProfileData } from "@/lib/publicStudentProfile";

type StudentData = PublicStudentProfileData;

interface StudentShareViewProps {
  studentId: string;
  initialData?: StudentData | null;
  baseUrl?: string;
}



function money(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
}

const getMonthName = (month: number) => {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString("en-IN", { month: "long" });
};

export default function StudentShareView({ studentId, initialData = null, baseUrl }: StudentShareViewProps) {
  const [data, setData] = useState<StudentData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [debugState, setDebugState] = useState<string>("Initializing...");
  const [portalUrl, setPortalUrl] = useState<string>(
    baseUrl ? `${baseUrl}/student/login` : "/student/login"
  );
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setPortalUrl(`${window.location.origin}/student/login`);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const fetchStudentData = async () => {
      try {
        if (isMounted) {
          setLoading(!initialData);
          setDebugState(`Fetching student ID: ${studentId}`);
        }
        
        const res = await fetch(`/api/public/students/${studentId}?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          },
          signal: controller.signal
        });
        
        if (!isMounted) return;
        setDebugState(`Response received. Status: ${res.status}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Student profile not found.");
          }
          throw new Error(`Failed to load student dashboard. Status: ${res.status}`);
        }
        
        setDebugState("Parsing JSON data...");
        const jsonData = await res.json();
        
        if (isMounted) {
          setDebugState("Data loaded successfully.");
          setData(jsonData);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        let errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        if (err instanceof Error && err.name === "AbortError") {
          errorMessage = "Network request timed out after 10 seconds. Please check your connection.";
        }
        setDebugState(`Error occurred: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudentData();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [studentId, initialData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 text-sm font-medium">Fetching secure student dashboard...</p>
        <p className="text-slate-400 text-xs font-mono mt-4 max-w-sm text-center bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">{debugState}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-slate-500 max-w-md mb-6">{error || "Could not retrieve student details."}</p>
        <div className="text-xs text-slate-400">Please make sure the QR code or link is correct and matches a valid student.</div>
      </div>
    );
  }

  // Formatting date
  const formattedJoinDate = new Date(data.joiningDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate Academic Growth Index
  const totalExams = data.examResults.length;
  const avgPercentage = totalExams > 0 
    ? Math.round(data.examResults.reduce((sum, exam) => sum + exam.percentage, 0) / totalExams)
    : null;

  const getAcademicStatus = (pct: number) => {
    if (pct >= 85) return { text: "Outstanding", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    if (pct >= 70) return { text: "Above Average", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    if (pct >= 50) return { text: "Satisfactory", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    return { text: "Requires Attention", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
  };

  const academicStatus = avgPercentage !== null ? getAcademicStatus(avgPercentage) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 font-sans">
      {/* Decorative Top Mesh Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-linear-to-b from-indigo-500/10 via-sky-500/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        {/* Header Ribbon / Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold tracking-wider text-sm shadow-md">
              TP
            </div>
            <span className="font-bold text-slate-800 dark:text-white tracking-wide text-lg">TuitionPro Student Portal</span>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
            Student Portal Access
          </span>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            {/* Student Photo */}
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-indigo-600 bg-slate-100 shadow-lg dark:bg-slate-800">
              {data.profilePhoto ? (
                <Image
                  src={data.profilePhoto}
                  alt={data.fullName}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-4xl font-extrabold text-indigo-600">
                    {data.fullName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Active Student
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 leading-tight">
                {data.fullName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
                Student ID: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">{data.studentCode}</code>
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Use the Student Portal for daily institute updates, attendance, exam records, fee details, and important announcements from your classes.
              </p>

              <div className="grid grid-cols-1 gap-y-3 gap-x-6 pt-6 mt-6 text-sm border-t border-slate-100 sm:grid-cols-2 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 justify-center md:justify-start">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <div>
                    <span className="text-slate-400 text-xs block">Enrolled Date</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{formattedJoinDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 justify-center md:justify-start">
                  <Award className="h-4 w-4 text-indigo-500" />
                  <div className="w-full">
                    <span className="text-slate-400 text-xs block">Academic Year</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{data.academicYear}</span>
                    <div className="mt-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/80 p-3 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                        Student Portal Login Link
                      </span>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        Open this link to sign in and check daily updates, attendance, fees, exams, and notices.
                      </p>
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-xs font-semibold text-indigo-700 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
                      >
                        {portalUrl}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Attendance Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Attendance Rate</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950 dark:text-white leading-none">{data.stats.attendancePercent}%</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 block pt-1.5">
                Attended <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.stats.attendancePresent}</span> of <span className="font-bold">{data.stats.attendanceTotal}</span> classes
              </span>
            </div>
            
            {/* Circular Progress Display */}
            <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                <circle cx="40" cy="40" r="34" 
                  className="stroke-indigo-600 dark:stroke-indigo-500 fill-none transition-all duration-500" 
                  strokeWidth="6" 
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - data.stats.attendancePercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                <CalendarDays className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* Pending Fees Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pending Fee Balance</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-extrabold leading-none ${data.stats.pendingFees > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {money(data.stats.pendingFees)}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 block pt-1.5">
                Total paid: <span className="font-bold text-emerald-600">{money(data.stats.feesPaid)}</span>
              </span>
            </div>

            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${data.stats.pendingFees > 0 ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"}`}>
              <CreditCard className="h-7 w-7" />
            </div>
          </div>

          {/* Academic Growth Index */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Academic Progress</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950 dark:text-white leading-none">
                  {avgPercentage !== null ? `${avgPercentage}%` : "N/A"}
                </span>
              </div>
              {academicStatus ? (
                <div className="pt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${academicStatus.color}`}>
                    {academicStatus.text}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 block pt-1.5">No exams recorded yet</span>
              )}
            </div>

            <div className="h-16 w-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-7 w-7" />
            </div>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          {/* Left Column: Academic Growth and Attendance Log */}
          <div className="space-y-8">
            {/* Academic Growth Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Academic Growth Track
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Percentage trends across examinations completed</p>
                </div>
              </div>

              {isMounted && data.examResults.length > 0 ? (
                <div className="h-64 w-full mt-4 pr-4 relative min-w-0">
                  <ResponsiveContainer width="99%" height={240}>
                    <AreaChart data={data.examResults}>
                      <defs>
                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis 
                        dataKey="examName" 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 500 }}
                        unit="%"
                      />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: "#1e293b", 
                          border: "none", 
                          borderRadius: "12px",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: "500",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                        }}
                        labelStyle={{ color: "#94a3b8", fontWeight: "600", fontSize: "10px" }}
                        formatter={(value) => [`${value}%`, "Score"]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#4f46e5" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#growthGrad)" 
                        dot={{ r: 4, strokeWidth: 2, fill: "#4f46e5" }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : data.examResults.length > 0 ? (
                <div className="h-64 w-full mt-4 bg-slate-100/50 dark:bg-slate-900/50 animate-pulse rounded-2xl" />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                  <Award className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No growth logs recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Academic tracking activates as exams are uploaded.</p>
                </div>
              )}
            </div>

            {/* Attendance Log */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <CalendarDays className="h-5 w-5 text-indigo-500" />
                Lecture Attendance Log
              </h3>

              {data.attendance.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {data.attendance.map((att) => {
                    const isPresent = att.status === "PRESENT";
                    const isLeave = att.status === "LEAVE" || att.status === "ON_LEAVE" || att.status === "LATE";
                    
                    let statusColor = "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-200/30";
                    let Icon = XCircle;
                    
                    if (isPresent) {
                      statusColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200/30";
                      Icon = CheckCircle2;
                    } else if (isLeave) {
                      statusColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200/30";
                      Icon = Clock;
                    }

                    return (
                      <div 
                        key={att.id} 
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${statusColor} shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-white text-sm">
                              {new Date(att.date).toLocaleDateString("en-IN", {
                                weekday: "long",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {att.lateMinutes && (
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded ml-2">
                                Late: {att.lateMinutes} min
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${statusColor}`}>
                          {att.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                  <Calendar className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No attendance entries available.</p>
                  <p className="text-xs text-slate-400 mt-1">Attendance records will show up here once marked by tutors.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fees and Exam Results List */}
          <div className="space-y-8">
            {/* Fee Ledger */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Fee Payment Ledger
              </h3>

              {data.feeRecords.length > 0 ? (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {data.feeRecords.map((fee) => {
                    const isPaid = fee.status === "PAID";
                    const isPending = fee.status === "PENDING";
                    const dueDateValue = fee.dueDate ? new Date(fee.dueDate) : null;
                    const isOverdue =
                      fee.status === "OVERDUE" ||
                      (isPending && dueDateValue !== null && dueDateValue < new Date());

                    let badgeColor = "bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-200/30";
                    let statusLabel = fee.status;

                    if (isPaid) {
                      badgeColor = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-200/30";
                    } else if (isPending && !isOverdue) {
                      badgeColor = "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200/30";
                    } else if (isOverdue) {
                      badgeColor = "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-200/30";
                      statusLabel = "OVERDUE";
                    }

                    return (
                      <div 
                        key={fee.id}
                        className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:shadow-sm transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {getMonthName(fee.month)} {fee.year} Fee
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Due by: {fee.dueDate
                                ? new Date(fee.dueDate).toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' })
                                : "N/A"}
                            </span>
                          </div>

                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/50 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Total</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{money(fee.totalAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Paid</span>
                            <span className="font-semibold text-emerald-600">{money(fee.paidAmount)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Pending</span>
                            <span className={`font-semibold ${fee.pendingAmount > 0 ? "text-rose-600" : "text-slate-500"}`}>{money(fee.pendingAmount)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                  <CreditCard className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No payment records found.</p>
                  <p className="text-xs text-slate-400 mt-1">Fee details will display as monthly bills generate.</p>
                </div>
              )}
            </div>

            {/* Exam Results List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Award className="h-5 w-5 text-indigo-500" />
                Examination Records
              </h3>

              {data.examResults.length > 0 ? (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {[...data.examResults].reverse().map((exam) => {
                    const scoreColor = exam.percentage >= 85 
                      ? "text-emerald-600" 
                      : exam.percentage >= 70 
                        ? "text-indigo-600" 
                        : exam.percentage >= 50 
                          ? "text-amber-600" 
                          : "text-rose-600";

                    return (
                      <div 
                        key={exam.id}
                        className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white text-sm truncate block">
                              {exam.examName}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Subject: <span className="font-semibold text-slate-600 dark:text-slate-300">{exam.subject}</span>
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              Date: {new Date(exam.examDate).toLocaleDateString("en-IN", { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-lg font-extrabold block leading-none ${scoreColor}`}>
                              {exam.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                              {exam.score} / {exam.totalMarks}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                  <Award className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No exam results recorded.</p>
                  <p className="text-xs text-slate-400 mt-1">Academic exam scores will show up here once graded.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-slate-400 text-xs mt-16 pt-6 border-t border-slate-200/40 dark:border-slate-800/60">
          <p>© {new Date().getFullYear()} TuitionPro Management System. All rights reserved.</p>
          <p className="mt-1">This report is dynamically compiled and securely transmitted. Please keep this URL confidential.</p>
        </div>
      </div>
    </div>
  );
}
