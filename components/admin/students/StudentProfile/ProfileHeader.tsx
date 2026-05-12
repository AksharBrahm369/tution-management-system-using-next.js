import React from "react";
import Link from "next/link";
import { ChevronDown, Download, Edit3, MessageSquare, BadgeAlert } from "lucide-react";
import { StudentProfileData } from "../types";

interface ProfileHeaderProps {
  student: StudentProfileData;
  onDownloadId: () => void;
  onChangeStatus: () => void;
}

function badgeClass(value: string): string {
  if (value === "ACTIVE") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
  if (value === "SUSPENDED") return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300";
  if (value === "ON_LEAVE") return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
  if (value === "GRADUATED") return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
  return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
}

function valueOrFallback(value?: string | null, fallback = "N/A"): string {
  return value && value.trim().length > 0 ? value : fallback;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ student, onDownloadId, onChangeStatus }) => {
  const age = student.dateOfBirth ? Math.floor((Date.now() - new Date(student.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const initials = student.fullName?.trim().slice(0, 2).toUpperCase() ?? "ST";
  const fullAddress = [student.addressLine1, student.addressLine2, student.city, student.state, student.pincode].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-xl dark:border-slate-800 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-blue-500 to-indigo-600 text-3xl font-bold shadow-lg sm:h-24 sm:w-24">
            {student.profilePhoto ? <img src={student.profilePhoto} alt={student.fullName} className="h-full w-full object-cover" /> : initials}
          </div>

          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Student Profile</p>
            <h1 className="mt-2 wrap-break-word text-2xl font-bold sm:text-3xl">{student.fullName}</h1>
            <p className="mt-1 break-all text-slate-300">{student.studentCode}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(student.status)}`}>{student.status}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{student.category}</span>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs text-slate-300">Phone</p>
            <p className="mt-1 break-all text-sm text-white">{valueOrFallback(student.phone, "No phone")}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs text-slate-300">Email</p>
            <p className="mt-1 break-all text-sm text-white">{valueOrFallback(student.email, "No email")}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs text-slate-300">Date of Birth</p>
            <p className="mt-1 wrap-break-word text-sm text-white">{student.dateOfBirth ? `${new Date(student.dateOfBirth).toLocaleDateString()}${age ? ` • ${age} yrs` : ""}` : "N/A"}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-xs text-slate-300">Blood Group</p>
            <p className="mt-1 wrap-break-word text-sm text-white">{valueOrFallback(student.bloodGroup, "No blood group")}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 sm:col-span-2">
            <p className="text-xs text-slate-300">Address</p>
            <p className="mt-1 wrap-break-word text-sm text-white">{valueOrFallback(fullAddress, "No address")}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-3 sm:col-span-2">
            <p className="text-xs text-slate-300">Current Batch</p>
            <p className="mt-1 wrap-break-word text-sm text-white">{valueOrFallback(student.currentBatch?.name, "No batch")}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 xl:col-span-2">
          <Link href={`/admin/students/${student.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100">
            <Edit3 size={16} /> Edit Profile
          </Link>
          <button onClick={onDownloadId} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            <Download size={16} /> Download ID Card
          </button>
          <button onClick={onChangeStatus} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            <BadgeAlert size={16} /> Change Status
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            <MessageSquare size={16} /> Send Message
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
            <ChevronDown size={16} /> More
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
