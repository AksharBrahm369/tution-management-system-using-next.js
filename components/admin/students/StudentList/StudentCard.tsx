import React, { useState } from "react";
import Link from "next/link";
import { Eye, Edit3, MoreVertical, Download, Trash2, Repeat } from "lucide-react";
import { StudentListItem } from "../types";

interface StudentCardProps {
  student: StudentListItem;
  onChangeStatus: (student: StudentListItem) => void;
  onDownloadId: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
}

function statusClass(status: string): string {
  switch (status) {
    case "ACTIVE": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "SUSPENDED": return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
    case "ON_LEAVE": return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
    case "GRADUATED": return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
    case "TRANSFERRED": return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
    default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function categoryClass(category: string): string {
  switch (category) {
    case "TOPPER": return "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300";
    case "GOOD": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
    case "AVERAGE": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default: return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300";
  }
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onChangeStatus, onDownloadId, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-lg">
            {student.profilePhoto ? (
              <img src={student.profilePhoto} alt={student.fullName} className="h-full w-full object-cover" />
            ) : (
              getInitials(student.fullName)
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{student.fullName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{student.studentCode}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{student.batch?.name ?? "No batch assigned"}</p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen((value) => !value)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => onChangeStatus(student)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><Repeat size={16} /> Change Status</button>
              <button onClick={() => onDownloadId(student)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"><Download size={16} /> Download ID Card</button>
              <button onClick={() => onDelete(student)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /> Delete Student</button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
        <p>{student.phone ?? "No phone provided"}</p>
        <p>{student.email ?? "No email provided"}</p>
        <p>{student.city ?? "No city"}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(student.status)}`}>{student.status}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryClass(student.category)}`}>{student.category}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Attendance {student.attendancePercent}%</span>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link href={`/admin/students/${student.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <Eye size={16} className="inline-block" /> View
        </Link>
        <Link href={`/admin/students/${student.id}/edit`} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <Edit3 size={16} className="inline-block" /> Edit
        </Link>
      </div>
    </div>
  );
};

export default StudentCard;
