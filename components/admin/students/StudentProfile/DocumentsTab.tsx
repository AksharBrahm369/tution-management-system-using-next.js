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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState("OTHER");
  const [customName, setCustomName] = useState("");
  const [uploading, setUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", selectedType);
      
      const docName = selectedType === "OTHER" && customName.trim() !== "" ? customName : selectedFile.name;
      formData.append("name", docName);

      const response = await fetch(`/api/admin/students/${student.id}/documents`, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error("Failed to upload document");
      }
      setSelectedFile(null);
      setCustomName("");
      setSelectedType("OTHER");
      onChanged();
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, maxSize: 5 * 1024 * 1024 });

  const emptyState = useMemo(() => student.documents.length === 0, [student.documents.length]);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Documents</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Upload and manage student documents here.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">Required/Suggested Documents:</span> Birth Certificate, School Leaving Certificate, Marksheets, ID Proof, Address Proof, Medical Records, and Photos.
        </p>
      </div>

      {!selectedFile ? (
        <div {...getRootProps()} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40"}`}>
          <input {...getInputProps()} />
          <Upload size={32} className="text-blue-600" />
          <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Drag & drop document here or click to browse</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Accepted: PDF, JPG, PNG, DOC. Max 5MB.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-700">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20"><FileText size={20} /></div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-sm font-medium text-red-600 hover:text-red-700">Remove</button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Type</label>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
            {selectedType === "OTHER" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Document Name</label>
                <input type="text" placeholder="e.g. Migration Certificate" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleUpload} disabled={uploading} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      )}

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
