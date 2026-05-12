"use client";

import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { StudentProfileData } from "../types";

interface DocumentsTabProps {
  student: StudentProfileData;
  onChanged: () => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ student, onChanged }) => {
  const [selectedType, setSelectedType] = useState("OTHER");
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", selectedType);
      formData.append("name", file.name);

      const response = await fetch(`/api/admin/students/${student.id}/documents`, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error("Failed to upload document");
      }
      onChanged();
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, maxSize: 5 * 1024 * 1024 });

  const emptyState = useMemo(() => student.documents.length === 0, [student.documents.length]);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documents</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload and manage student documents here.</p>
      </div>

      <div {...getRootProps()} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"}`}>
        <input {...getInputProps()} />
        <Upload size={32} className="text-blue-600" />
        <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Drag & drop document here or click to browse</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Accepted: PDF, JPG, PNG, DOC. Max 5MB.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Type:</label>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
            <option value="SCHOOL_LEAVING">School Leaving</option>
            <option value="MARKSHEET">Marksheet</option>
            <option value="ID_PROOF">ID Proof</option>
            <option value="ADDRESS_PROOF">Address Proof</option>
            <option value="MEDICAL">Medical</option>
            <option value="PHOTO">Photo</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        {uploading && <p className="mt-3 text-sm font-medium text-blue-600">Uploading...</p>}
      </div>

      {emptyState ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {student.documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20"><FileText size={18} /></div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{document.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{document.type} • {document.fileSize ?? "Unknown size"} • {new Date(document.uploadedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={document.fileUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"><Download size={16} className="inline-block" /> Download</a>
                <button className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-900/40"> <Trash2 size={16} className="inline-block" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
