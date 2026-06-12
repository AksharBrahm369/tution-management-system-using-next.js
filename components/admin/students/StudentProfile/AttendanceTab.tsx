import React, { useMemo } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Calendar, Sparkles, Clock, Check, X, ShieldAlert } from "lucide-react";
import { StudentProfileData } from "../types";

interface AttendanceTabProps {
  student: StudentProfileData;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ student }) => {
  const attendanceList = student.attendance || [];
  
  // Calculations
  const totalClasses = attendanceList.length;
  const presentDays = attendanceList.filter((item) => item.status === "PRESENT").length;
  const absentDays = attendanceList.filter((item) => item.status === "ABSENT").length;
  const lateEntries = attendanceList.filter((item) => item.status === "LATE").length;
  const attendanceRate = student.attendancePercent;

  // Status configuration
  let statusTitle = "Excellent Attendance";
  let statusDesc = "The student is highly consistent and maintaining outstanding classroom participation.";
  let statusTheme = {
    ring: "text-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/5 border-emerald-500/10",
    icon: <CheckCircle2 size={16} className="text-emerald-500" />
  };

  if (attendanceRate < 75) {
    statusTitle = "Critical Attendance";
    statusDesc = "Attendance is critically low. Direct administrative review and parent notifications are required.";
    statusTheme = {
      ring: "text-rose-500",
      text: "text-rose-600 dark:text-rose-455",
      bg: "bg-rose-500/5 border-rose-500/10",
      icon: <ShieldAlert size={16} className="text-rose-500" />
    };
  } else if (attendanceRate < 90) {
    statusTitle = "Needs Attention";
    statusDesc = "Class presence is slightly below target. Monitor absences to ensure consistency.";
    statusTheme = {
      ring: "text-amber-500",
      text: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/5 border-amber-500/10",
      icon: <AlertTriangle size={16} className="text-amber-500" />
    };
  }

  // Monthly trend calculations
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { total: number; present: number }> = {};
    attendanceList.forEach((item) => {
      const date = new Date(item.classDate);
      const key = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!months[key]) {
        months[key] = { total: 0, present: 0 };
      }
      months[key].total += 1;
      if (item.status === "PRESENT" || item.status === "LATE") {
        months[key].present += 1;
      }
    });

    return Object.entries(months).map(([name, data]) => {
      const rate = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
      return { name, rate, ...data };
    }).reverse().slice(0, 6); // Last 6 months
  }, [attendanceList]);

  // SVG Progress Ring calculations
  const radius = 52;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return (
    <div className="space-y-6">
      
      {/* SECTION 7: ATTENDANCE ANALYTICS PANEL */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
        
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Attendance Analytics
          </h3>
          <p className="text-xs text-slate-405 dark:text-slate-500 mt-0.5">
            Real-time classroom consistency records and analysis logs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
          
          {/* Col 1: Circular Progress Ring & Summary */}
          <div className="flex items-center gap-5 pb-4 md:pb-0 md:pr-5">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90">
                <circle
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth={stroke}
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  className={`${statusTheme.ring} transition-all duration-500`}
                  strokeWidth={stroke}
                  strokeDasharray={circumference + " " + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">{attendanceRate}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Rate</span>
              </div>
            </div>

            <div>
              <div className={`rounded-md border p-3 ${statusTheme.bg}`}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {statusTheme.icon}
                  <span className={statusTheme.text}>{statusTitle}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {statusDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Col 2: High Density Metrics */}
          <div className="py-4 md:py-0 md:px-6 flex flex-col justify-center gap-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Classes</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalClasses} Sessions</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-slate-50 dark:bg-slate-950/20 p-2 border border-slate-100 dark:border-slate-850">
                <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Present</span>
                <span className="text-sm font-bold text-emerald-600 mt-0.5 block">{presentDays}d</span>
              </div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-950/20 p-2 border border-slate-100 dark:border-slate-850">
                <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Absent</span>
                <span className="text-sm font-bold text-rose-600 mt-0.5 block">{absentDays}d</span>
              </div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-950/20 p-2 border border-slate-100 dark:border-slate-850">
                <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Late</span>
                <span className="text-sm font-bold text-amber-600 mt-0.5 block">{lateEntries}d</span>
              </div>
            </div>
          </div>

          {/* Col 3: Monthly Trend progress bars */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
              Monthly Attendance Trend
            </span>
            {monthlyTrend.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No historical trend data</p>
            ) : (
              <div className="space-y-2.5">
                {monthlyTrend.map((m) => (
                  <div key={m.name} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-650 dark:text-slate-350">
                      <span>{m.name}</span>
                      <span>{m.rate}% <span className="text-[10px] font-normal text-slate-400">({m.present}/{m.total})</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${m.rate >= 90 ? "bg-emerald-500" : m.rate >= 75 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${m.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Recent Attendance Logs */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 pb-2 dark:border-slate-800/80">
          Attendance Log Logs
        </h4>

        {attendanceList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-450 dark:text-slate-500 font-semibold">
            No attendance has been recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {attendanceList.map((item) => {
                  let badge = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
                  if (item.status === "ABSENT") {
                    badge = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
                  } else if (item.status === "LATE") {
                    badge = "bg-amber-500/10 text-amber-705 dark:text-amber-400 border border-amber-500/20";
                  }
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(item.classDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 italic">
                        {item.remark || <span className="text-slate-350 dark:text-slate-650 not-italic">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AttendanceTab;
