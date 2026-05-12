import React from "react";
import { StudentListItem } from "../types";
import StudentTableRow from "./StudentTableRow";

interface StudentTableViewProps {
  students: StudentListItem[];
  selectedIds: string[];
  onToggleSelect: (studentId: string) => void;
  onToggleAll: (studentIds: string[]) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
}

const StudentTableView: React.FC<StudentTableViewProps> = ({ students, selectedIds, onToggleSelect, onToggleAll, sortBy, sortOrder, onSort }) => {
  const allSelected = students.length > 0 && students.every((student) => selectedIds.includes(student.id));

  const sortIndicator = (column: string) => (sortBy === column ? (sortOrder === "asc" ? " ▲" : " ▼") : "");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={() => onToggleAll(students.map((student) => student.id))} className="h-4 w-4 rounded border-slate-300 text-blue-600" /></th>
              {[
                ["name", "Student"],
                ["contact", "Contact"],
                ["batch", "Batch"],
                ["joiningDate", "Joining Date"],
                ["status", "Status"],
                ["category", "Category"],
                ["attendance", "Attendance %"],
                ["feeStatus", "Fee Status"],
              ].map(([column, label]) => (
                <th key={column} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  <button type="button" onClick={() => onSort(column)} className="transition hover:text-blue-600">
                    {label}{sortIndicator(column)}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <StudentTableRow key={student.id} student={student} selected={selectedIds.includes(student.id)} onToggleSelect={onToggleSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTableView;
