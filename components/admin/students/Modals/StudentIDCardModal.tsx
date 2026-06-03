"use client";

import React, { useState, useEffect } from "react";
import { Download, Printer, X, Loader2 } from "lucide-react";
import QRCode from "qrcode";

type StudentIDCardData = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  studentCode: string;
  phone: string | null;
  academicYear: string;
  profilePhoto?: string | null;
  currentBatch?: { name: string } | null;
  batch?: { name: string } | null;
  joiningDate?: string | Date | null;
  email?: string | null;
  parent?: {
    fatherName?: string | null;
    fatherPhone?: string | null;
    fatherEmail?: string | null;
    motherName?: string | null;
    motherPhone?: string | null;
    primaryContact?: string | null;
  } | null;
};

interface StudentIDCardModalProps {
  student: StudentIDCardData;
  onClose: () => void;
}

const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({ student, onClose }) => {
  const [fullStudent, setFullStudent] = useState<StudentIDCardData>(student);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch full details if basic list details are passed
  useEffect(() => {
    const fetchFullDetails = async () => {
      // If we don't have email or parent details, fetch full profile from public route
      if (!student.email || !student.parent || !student.joiningDate) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/public/students/${student.id}`);
          if (response.ok) {
            const data = await response.json();
            setFullStudent((prev) => ({
              ...prev,
              ...data,
              // Map currentBatch structure correctly
              currentBatch: data.currentBatch || prev.currentBatch || prev.batch,
            }));
          }
        } catch (error) {
          console.error("Failed to load full student details:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setFullStudent(student);
      }
    };

    fetchFullDetails();
  }, [student]);

  // 2. Generate QR code on client mount / data loaded
  useEffect(() => {
    const generateQR = async () => {
      try {
        let origin = window.location.origin;
        
        // If testing on localhost, try to get the real local IP so mobile testing works
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          try {
            const ipRes = await fetch('/api/system/ip');
            if (ipRes.ok) {
              const { ip } = await ipRes.json();
              if (ip && ip !== 'localhost') {
                origin = `http://${ip}:${window.location.port}`;
              }
            }
          } catch (e) {
            console.error("Failed to fetch local IP", e);
          }
        }

        const portalUrl = `${origin}/share/student/${student.id}`;
        const dataUrl = await QRCode.toDataURL(portalUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: "#1e3a8a", // Premium navy blue color matching user template
            light: "#ffffff",
          },
        });
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
      }
    };

    generateQR();
  }, [student.id]);

  // Fallback calculations
  const displayFullName = fullStudent.fullName || `${fullStudent.firstName || ""} ${fullStudent.lastName || ""}`.trim() || "Student";
  const initials = displayFullName.slice(0, 2).toUpperCase() || "ST";
  const displayBatch = fullStudent.currentBatch?.name || fullStudent.batch?.name || "No Batch";
  
  // Format joining date
  const displayJoined = fullStudent.joiningDate
    ? new Date(fullStudent.joiningDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : "N/A";

  // Resolve best contact details (parent or student phone/email)
  const displayPhone =
    fullStudent.phone ||
    fullStudent.parent?.fatherPhone ||
    fullStudent.parent?.motherPhone ||
    "N/A";

  const displayEmail =
    fullStudent.email ||
    fullStudent.parent?.fatherEmail ||
    "N/A";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
      {/* Printable Inject CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-id-card, #printable-id-card * {
            visibility: visible !important;
          }
          #printable-id-card {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) scale(1.3) !important;
            box-shadow: none !important;
            border: none !important;
            background: #e6f0fa !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
        }
      ` }} />

      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Student ID Card</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="my-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Preparing student card data...</p>
          </div>
        ) : (
          <div className="mt-6 flex justify-center">
            {/* The Redesigned ID Card matching the template */}
            <div
              id="printable-id-card"
              className="w-[320px] h-[500px] rounded-3xl bg-[#e6f0fa] shadow-xl relative overflow-hidden flex flex-col font-sans border border-slate-300/40 text-slate-800"
            >
              {/* Top Section: QR Code & Photo */}
              <div className="h-[180px] p-6 flex justify-between items-center">
                {/* QR Code box */}
                <div className="w-[110px] h-[110px] bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-md border border-slate-200/60">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Parent Portal QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-[10px] text-slate-400 font-medium">QR Code</div>
                  )}
                </div>

                {/* Profile Photo with thick blue border */}
                <div className="w-[110px] h-[110px] bg-[#dbeafe] rounded-2xl border-[3px] border-[#4a5fdf] overflow-hidden flex items-center justify-center shadow-md">
                  {fullStudent.profilePhoto ? (
                    <img src={fullStudent.profilePhoto} alt={displayFullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#4a5fdf]">{initials}</span>
                  )}
                </div>
              </div>

              {/* Middle Section: wide blue name ribbon */}
              <div className="bg-[#4a5fdf] py-4 px-4 text-center shadow-md">
                <h4 className="text-white text-xl font-bold tracking-wide leading-tight truncate font-serif" style={{ fontFamily: "Georgia, serif" }}>
                  {displayFullName}
                </h4>
                <p className="text-[#cdd7ff] text-[10px] uppercase tracking-[0.2em] font-semibold mt-1">
                  STUDENT
                </p>
              </div>

              {/* Details Section */}
              <div className="p-6 flex-1 flex flex-col justify-center space-y-3">
                <div className="flex text-xs items-center">
                  <span className="w-20 text-[#5a6fa8] font-bold uppercase tracking-wider text-[9px]">ID</span>
                  <span className="flex-1 text-[#1e2e5c] font-semibold break-all">{fullStudent.studentCode}</span>
                </div>
                <div className="flex text-xs items-center">
                  <span className="w-20 text-[#5a6fa8] font-bold uppercase tracking-wider text-[9px]">Batch</span>
                  <span className="flex-1 text-[#1e2e5c] font-semibold truncate">{displayBatch}</span>
                </div>
                <div className="flex text-xs items-center">
                  <span className="w-20 text-[#5a6fa8] font-bold uppercase tracking-wider text-[9px]">Joined</span>
                  <span className="flex-1 text-[#1e2e5c] font-semibold">{displayJoined}</span>
                </div>
                <div className="flex text-xs items-center">
                  <span className="w-20 text-[#5a6fa8] font-bold uppercase tracking-wider text-[9px]">Phone</span>
                  <span className="flex-1 text-[#1e2e5c] font-semibold truncate">{displayPhone}</span>
                </div>
                <div className="flex text-xs items-center">
                  <span className="w-20 text-[#5a6fa8] font-bold uppercase tracking-wider text-[9px]">Email</span>
                  <span className="flex-1 text-[#1e2e5c] font-semibold truncate break-all">{displayEmail}</span>
                </div>
              </div>

              {/* Bottom Footer Ribbon */}
              <div className="bg-[#4a5fdf] h-12 px-6 flex justify-between items-center text-white">
                <span className="text-[10px] font-medium tracking-wider text-[#cdd7ff]">www.tuitionpro.com</span>
                <span className="text-[9px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded-sm">
                  TUITIONPRO
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
          >
            <Printer size={16} /> Print ID Card
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download size={16} /> Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCardModal;
