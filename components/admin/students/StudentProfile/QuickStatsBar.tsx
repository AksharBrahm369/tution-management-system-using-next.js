import React from "react";
import { CheckCircle, IndianRupee, BookOpen, GraduationCap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StudentProfileData } from "../types";

interface QuickStatsBarProps {
  student: StudentProfileData;
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ student }) => {
  // 1. Attendance calculations
  const totalClasses = student.attendance?.length ?? 0;
  const presentDays = student.attendance?.filter((item) => item.status === "PRESENT").length ?? 0;
  const attendanceRate = student.attendancePercent;
  let attendanceStatus = "Excellent";
  let attendanceStatusColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";
  let attendanceBarColor = "bg-emerald-500";
  if (attendanceRate < 75) {
    attendanceStatus = "Critical";
    attendanceStatusColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400";
    attendanceBarColor = "bg-rose-505";
  } else if (attendanceRate < 90) {
    attendanceStatus = "Warning";
    attendanceStatusColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400";
    attendanceBarColor = "bg-amber-500";
  }

  // 2. Fee calculations
  const totalBilled = student.feeRecords?.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;
  const totalPaid = student.feesPaid;
  const pendingFees = student.pendingFees;
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;
  let feeStatus = "No Dues";
  let feeStatusColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";
  if (pendingFees > 0) {
    feeStatus = "Dues Pending";
    feeStatusColor = "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400";
  }

  // 3. Academic calculations
  const examResults = student.examResults || [];
  const totalScore = examResults.reduce((sum, r) => sum + r.score, 0);
  const totalMax = examResults.reduce((sum, r) => sum + r.totalMarks, 0);
  const avgExamScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;
  const category = student.category;

  // 4. Performance Trend Indicator
  let trendIcon = <Minus size={12} className="text-slate-400" />;
  let trendText = "Stable";
  let trendColor = "text-slate-500 bg-slate-50 dark:bg-slate-950/30 dark:text-slate-400";
  if (category === "TOPPER" || category === "GOOD") {
    trendIcon = <TrendingUp size={12} className="text-emerald-500" />;
    trendText = "Strong";
    trendColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400";
  } else if (category === "WEAK") {
    trendIcon = <TrendingDown size={12} className="text-rose-500" />;
    trendText = "Needs Review";
    trendColor = "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400";
  }

  // 5. Mock assignments (as requested in Section 3 to present complete dashboard view)
  const assignmentsSubmitted = 7;
  const assignmentsTotal = 8;
  const assignmentsRate = Math.round((assignmentsSubmitted / assignmentsTotal) * 100);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Student Snapshot
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/80">
        
        {/* Attendance Section */}
        <div className="flex flex-col justify-between pt-4 sm:pt-0 sm:pr-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <CheckCircle size={14} className="text-blue-500" /> Attendance
              </span>
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${attendanceStatusColor}`}>
                {attendanceStatus}
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {attendanceRate}%
            </p>
            <p className="text-[11px] font-medium text-slate-450 dark:text-slate-500">
              Present {presentDays} of {totalClasses} classes
            </p>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${attendanceBarColor}`} style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>

        {/* Fees Health Section */}
        <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:pl-5 sm:pr-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <IndianRupee size={14} className="text-amber-500" /> Financial Health
              </span>
              <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${feeStatusColor}`}>
                {feeStatus}
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ₹{pendingFees.toLocaleString("en-IN")} <span className="text-xs font-medium text-slate-400">pending</span>
            </p>
            <p className="text-[11px] font-medium text-slate-455 dark:text-slate-500">
              Paid ₹{totalPaid.toLocaleString("en-IN")} of ₹{totalBilled.toLocaleString("en-IN")} billed ({collectionRate}%)
            </p>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>

        {/* Academic Analytics Section */}
        <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:pl-5 sm:pr-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <GraduationCap size={14} className="text-purple-500" /> Academic Average
              </span>
              <span className={`flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${trendColor}`}>
                {trendIcon}
                <span>{trendText}</span>
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {avgExamScore !== null ? `${avgExamScore}%` : "N/A"}
            </p>
            <p className="text-[11px] font-medium text-slate-455 dark:text-slate-500">
              Tested across {examResults.length} examinations
            </p>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${avgExamScore ?? 0}%` }} />
          </div>
        </div>

        {/* Assignments Section */}
        <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:pl-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <BookOpen size={14} className="text-cyan-500" /> Assignments
              </span>
              <span className="rounded-sm bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 text-[10px] font-bold">
                {assignmentsRate === 100 ? "Complete" : "On Track"}
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {assignmentsSubmitted}/{assignmentsTotal}
            </p>
            <p className="text-[11px] font-medium text-slate-455 dark:text-slate-500">
              Submission Rate: {assignmentsRate}%
            </p>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${assignmentsRate}%` }} />
          </div>
        </div>

      </div>
    </section>
  );
};

export default QuickStatsBar;
