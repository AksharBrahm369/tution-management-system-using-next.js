"use client";

import React from "react";
import { Download, Printer, X } from "lucide-react";
type StudentIDCardData = {
  id: string;
  fullName: string;
  studentCode: string;
  phone: string | null;
  academicYear: string;
  profilePhoto?: string | null;
  currentBatch?: { name: string } | null;
  batch?: { name: string } | null;
};

interface StudentIDCardModalProps {
  student: StudentIDCardData;
  onClose: () => void;
}

const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({ student, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Student ID Card</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-slate-200 bg-linear-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-blue-200">TuitionPro</p>
          <div className="mt-4 flex flex-col items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">{student.fullName.slice(0, 2).toUpperCase()}</div>
            <h4 className="mt-4 text-2xl font-bold">{student.fullName}</h4>
            <p className="text-sm text-slate-300">{student.studentCode}</p>
            <p className="mt-2 text-sm text-slate-300">{student.currentBatch?.name ?? student.batch?.name ?? "No batch"}</p>
            <p className="mt-2 text-sm text-slate-300">📱 {student.phone ?? "N/A"}</p>
            <p className="mt-1 text-sm text-slate-300">{student.academicYear}</p>
          </div>
          <div className="mt-6 flex justify-center rounded-2xl bg-white/10 py-6">QR CODE</div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"><Printer size={16} className="inline-block" /> Print</button>
          <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"><Download size={16} className="inline-block" /> Download PDF</button>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCardModal;
