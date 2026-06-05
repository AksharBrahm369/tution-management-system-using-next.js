import React from "react";
import Link from "next/link";
import { Edit3, Eye, MoreVertical } from "lucide-react";
import { StudentListItem } from "../types";

interface StudentTableRowProps {
  student: StudentListItem;
  selected: boolean;
  onToggleSelect: (studentId: string) => void;
  basePath?: string;
}

function badgeClass(value: string): string {
  if (value === "ACTIVE") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
  if (value === "SUSPENDED") return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  if (value === "ON_LEAVE") return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

const StudentTableRow: React.FC<StudentTableRowProps> = ({ student, selected, onToggleSelect, basePath = "/admin/students" }) => {
  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
      <td className="px-4 py-4">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(student.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      </td>
      <td className="px-4 py-4">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{student.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{student.studentCode}</p>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
        <div>{student.phone ?? "-"}</div>
        <div>{student.email ?? "-"}</div>
      </td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{student.standard?.name ?? "No standard"}</td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{student.batch?.name ?? "No batch"}</td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{new Date(student.joiningDate).toLocaleDateString()}</td>
      <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(student.status)}`}>{student.status}</span></td>
      <td className="px-4 py-4"><span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300">{student.category}</span></td>
      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="w-32 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: `${student.attendancePercent}%` }} />
        </div>
        <span className="mt-1 block text-xs">{student.attendancePercent}%</span>
      </td>
      <td className="px-4 py-4 text-sm">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{student.feeStatus}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Link href={`${basePath}/${student.id}`} className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Eye size={16} /></Link>
          <Link href={`${basePath}/${student.id}/edit`} className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Edit3 size={16} /></Link>
          <button className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><MoreVertical size={16} /></button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;
