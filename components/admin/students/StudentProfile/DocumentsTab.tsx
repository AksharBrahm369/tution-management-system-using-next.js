"use client";

import React, { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Download, FileText, Trash2, Upload, File, Image, FileArchive, X } from "lucide-react";
import { StudentProfileData } from "../types";

interface DocumentsTabProps {
  student: StudentProfileData;
  onChanged: () => void;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "gif") {
    return <Image size={15} className="text-emerald-500" />;
  }
  if (ext === "zip" || ext === "rar" || ext === "tar" || ext === "gz") {
    return <FileArchive size={15} className="text-amber-500" />;
  }
  return <FileText size={15} className="text-blue-500" />;
}

function getDocTypeBadge(type: string): string {
  switch (type) {
    case "BIRTH_CERTIFICATE":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
    case "SCHOOL_LEAVING":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
    case "MARKSHEET":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
    case "ID_PROOF":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20";
    case "ADDRESS_PROOF":
      return "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20";
    case "MEDICAL":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-455 border border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-550/20";
  }
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
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
      
      {/* SECTION 9: DOCUMENTS HEADER */}
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800/80">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Document Vault
        </h3>
        <p className="text-xs text-slate-405 dark:text-slate-500 mt-0.5">
          Store, retrieve, and audit verification documents and official credentials.
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium leading-relaxed">
          <span className="font-bold text-slate-500 dark:text-slate-455">Requirements list:</span> Birth Certificate, Leaving Certificate, Marksheets, ID Proof, Address Proof, Medical Records.
        </p>
      </div>

      {/* Drag and Drop Zone */}
      {!selectedFile ? (
        <div {...getRootProps()} className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${isDragActive ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/10" : "border-slate-250 bg-slate-50/50 hover:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/20"}`}>
          <input {...getInputProps()} />
          <Upload size={24} className="text-blue-550" />
          <p className="mt-2 text-xs font-bold text-slate-800 dark:text-white">Drag & drop document or click to browse</p>
          <p className="mt-0.5 text-[10px] text-slate-455 dark:text-slate-500">PDF, JPG, PNG, DOC up to 5MB</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200/80 p-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-650 dark:bg-blue-950/20 dark:text-blue-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer">
              <X size={12} /> Remove
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Category</label>
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
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
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Filename</label>
                <input type="text" placeholder="e.g. Character Certificate" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={handleUpload} disabled={uploading} className="rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 9: COMPACT FILE ROWS */}
      {emptyState ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-850">
          <p className="text-xs font-semibold text-slate-455 dark:text-slate-500">No documents cataloged in this profile vault.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-150 rounded-lg dark:border-slate-800 overflow-hidden bg-slate-50/20">
          {student.documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-3 p-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100/80 dark:bg-slate-800 text-slate-605">
                  {getFileIcon(document.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-905 dark:text-white truncate max-w-[200px] sm:max-w-md" title={document.name}>
                    {document.name}
                  </p>
                  <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold mt-0.5">
                    {document.fileSize ?? "Unknown Size"} · Uploaded on {new Date(document.uploadedAt).toLocaleDateString("en-IN", { dateStyle: "short" })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 shrink-0">
                <span className={`inline-block rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${getDocTypeBadge(document.type)}`}>
                  {document.type.replace("_", " ")}
                </span>
                
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 px-2.5 items-center justify-center gap-1 rounded bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-350 transition font-bold"
                  title="Download File"
                >
                  <Download size={11} />
                  <span className="hidden sm:inline">Get</span>
                </a>
                
                <button
                  className="flex h-7 w-7 items-center justify-center rounded border border-rose-200/60 bg-white text-rose-600 hover:bg-rose-50/50 dark:border-rose-900/40 dark:bg-slate-900 transition cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
