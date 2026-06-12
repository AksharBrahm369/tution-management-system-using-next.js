import React from "react";
import Link from "next/link";
import { Download, Edit3, MessageSquare, BadgeAlert, KeyRound, Loader2, RefreshCw, CheckCircle, IndianRupee, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { StudentProfileData } from "../types";

interface ProfileHeaderProps {
  student: StudentProfileData;
  onDownloadId: () => void;
  onChangeStatus: () => void;
  onCreateStudentLogin: () => void;
  isCreatingStudentLogin: boolean;
  onResetStudentPassword: () => void;
  isResettingStudentPassword: boolean;
  editHref?: string;
  latestActivity?: string;
}

function badgeClass(value: string): string {
  if (value === "ACTIVE") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  if (value === "SUSPENDED") return "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  if (value === "ON_LEAVE") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  if (value === "GRADUATED") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  return "bg-slate-500/10 text-slate-600 dark:text-slate-450 border border-slate-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
}

function categoryClass(value: string): string {
  if (value === "TOPPER") return "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  if (value === "GOOD") return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  if (value === "AVERAGE") return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase rounded";
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  student,
  onDownloadId,
  onChangeStatus,
  onCreateStudentLogin,
  isCreatingStudentLogin,
  onResetStudentPassword,
  isResettingStudentPassword,
  editHref,
  latestActivity = "Active today",
}) => {
  const initials = student.fullName?.trim().slice(0, 2).toUpperCase() ?? "ST";
  const hasStudentLogin = Boolean(student.userId);
  const standardName = student.standard?.name ?? "Unassigned";

  // Calculate Average Exam Score
  const examResults = student.examResults || [];
  const totalScore = examResults.reduce((sum, r) => sum + r.score, 0);
  const totalMax = examResults.reduce((sum, r) => sum + r.totalMarks, 0);
  const avgExamScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;

  return (
    <div className="space-y-4">
      {/* SECTION 1: PROFILE HERO */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Left Column: Avatar + Primary Identity */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-xs sm:h-24 sm:w-24">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt={student.fullName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl truncate">
                  {student.fullName}
                </h1>
                <span className={badgeClass(student.status)}>
                  {student.status}
                </span>
                <span className={categoryClass(student.category)}>
                  {student.category}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-450 dark:text-slate-500 tracking-tight">
                Student ID: <span className="font-mono text-slate-650 dark:text-slate-400">{student.studentCode}</span>
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500">Standard:</span> {standardName}
                </span>
                <span className="hidden h-3 w-px bg-slate-200 dark:bg-slate-800 sm:inline"></span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400 dark:text-slate-500">Batch:</span> {student.currentBatch?.name ?? "Unassigned"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Compact summary metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:w-[55%] shrink-0">
            {/* Attendance % */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <CheckCircle size={12} className="text-emerald-500" />
                <span>Attendance</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {student.attendancePercent}%
              </p>
            </div>

            {/* Fees Paid */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <IndianRupee size={12} className="text-blue-500" />
                <span>Paid</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                ₹{student.feesPaid.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Pending Fees */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <IndianRupee size={12} className="text-amber-550 dark:text-amber-500" />
                <span>Pending</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
                ₹{student.pendingFees.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Average Exam Score */}
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <FileText size={12} className="text-purple-500" />
                <span>Avg Score</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {avgExamScore !== null ? `${avgExamScore}%` : "N/A"}
              </p>
            </div>

            {/* Last Activity */}
            <div className="col-span-2 sm:col-span-1 rounded-lg border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-950/20">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Calendar size={12} className="text-slate-500" />
                <span>Activity</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                {latestActivity}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 2: ACTION BAR (Sticky Rail) */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur-md dark:border-slate-850 dark:bg-slate-900/95 rounded-xl shadow-xs">
        
        {/* Left: Primary actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={editHref ?? `/admin/students/${student.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Edit3 size={14} /> Edit Profile
          </Link>

          <Link
            href={`/admin/fees/collect?studentId=${student.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
          >
            <IndianRupee size={14} /> Collect Fee
          </Link>

          <Link
            href="/admin/attendance"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200/50 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750 transition"
          >
            <CheckCircle size={14} /> Mark Attendance
          </Link>
        </div>

        {/* Right: Secondary actions (visually prioritized lower) */}
        <div className="flex flex-wrap items-center gap-2">
          {hasStudentLogin ? (
            <button
              onClick={onResetStudentPassword}
              disabled={isResettingStudentPassword}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isResettingStudentPassword ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>Reset Portal Pass</span>
            </button>
          ) : (
            <button
              onClick={onCreateStudentLogin}
              disabled={isCreatingStudentLogin}
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/25 transition disabled:opacity-50 cursor-pointer"
            >
              {isCreatingStudentLogin ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
              <span>Enable Portal</span>
            </button>
          )}

          <button
            onClick={onDownloadId}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-605 border border-slate-200/40 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-350 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <Download size={13} /> ID Card
          </button>

          <button
            onClick={onChangeStatus}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-605 border border-slate-200/40 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-350 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <BadgeAlert size={13} /> Status
          </button>

          <button
            onClick={() => {
              const phone = student.phone || student.parent?.fatherPhone || student.parent?.motherPhone;
              if (phone) {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                window.open(`https://wa.me/${finalPhone}`, "_blank");
              } else {
                toast.error("No registered phone number.");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-605 border border-slate-200/40 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-350 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <MessageSquare size={13} /> Message
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileHeader;
