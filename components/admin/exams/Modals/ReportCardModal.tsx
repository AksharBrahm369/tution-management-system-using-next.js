"use client";

import { useState } from "react";

export default function ReportCardModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (studentId?: string) => void }) {
  const [studentId, setStudentId] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Generate Report Cards</h3>
        <p className="mt-2 text-sm text-slate-500">Leave student id empty to generate for all students.</p>
        <input aria-label="Student ID for report card" className="mt-4 w-full rounded-lg border px-3 py-2" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID (optional)" />
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={() => onGenerate(studentId || undefined)}>Generate</button>
        </div>
      </div>
    </div>
  );
}
