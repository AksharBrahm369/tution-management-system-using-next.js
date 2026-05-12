"use client";

import React, { useState } from "react";
import { Download, Upload, X } from "lucide-react";

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/students/import", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Import failed");
      const payload = await response.json();
      setResult({ imported: payload.imported, failed: payload.failed });
      onImported();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Import Students via Excel</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload an Excel file to bulk import student records.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <div className="mt-6 space-y-4">
          <a href="#" onClick={(event) => event.preventDefault()} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"><Download size={16} /> Download Excel Template</a>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Upload size={28} className="text-blue-600" />
            <span className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Click to select Excel file</span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{file ? file.name : "No file selected"}</span>
          </label>

          {result && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              Imported {result.imported} students, {result.failed} failed.
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
            <button onClick={handleImport} disabled={!file || isUploading} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
              {isUploading ? "Importing..." : "Import Students"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportStudentsModal;
