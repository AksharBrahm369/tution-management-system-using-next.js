import React from "react";
import { StudentProfileData } from "../types";

interface AttendanceTabProps {
  student: StudentProfileData;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ student }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance module coming soon</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Total classes</p><p className="mt-2 text-2xl font-bold">{student.attendance.length}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Present</p><p className="mt-2 text-2xl font-bold">{student.attendance.filter((item) => item.status === "PRESENT").length}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Absent</p><p className="mt-2 text-2xl font-bold">{student.attendance.filter((item) => item.status === "ABSENT").length}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Attendance %</p><p className="mt-2 text-2xl font-bold">{student.attendancePercent}%</p></div>
      </div>
    </div>
  );
};

export default AttendanceTab;
