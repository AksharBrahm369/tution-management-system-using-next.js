import React from "react";
import { Phone, Mail, MessageSquare, AlertCircle, ShieldAlert, Heart, User, Check, Users } from "lucide-react";
import { StudentProfileData } from "../types";

interface OverviewTabProps {
  student: StudentProfileData;
}

function DetailItem({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value || <span className="text-slate-350 dark:text-slate-655 font-normal italic">Not Provided</span>}
      </div>
    </div>
  );
}

const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
  const address = [
    student.addressLine1,
    student.addressLine2,
    student.city,
    student.state,
    student.pincode
  ].filter(Boolean).join(", ");

  // Parent Contact Cards helper
  const renderParentCard = (
    name: string | null,
    phone: string | null,
    email: string | null,
    relationship: string,
    occupation: string | null,
    isPrimary: boolean
  ) => {
    if (!name && !phone && !email) return null;

    const handleWhatsApp = (phoneNum: string) => {
      const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
      const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${finalPhone}`, "_blank");
    };

    return (
      <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <User size={15} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{name ?? "Unnamed"}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{relationship}</p>
            </div>
          </div>
          {isPrimary && (
            <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Primary Contact
            </span>
          )}
        </div>

        {occupation && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-400">Occupation:</span> {occupation}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800/40">
          <div className="flex gap-2">
            {phone && (
              <>
                <a
                  href={`tel:${phone}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 transition"
                  title="Call Parent"
                >
                  <Phone size={13} />
                </a>
                <button
                  onClick={() => handleWhatsApp(phone)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-emerald-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 transition cursor-pointer"
                  title="WhatsApp Parent"
                >
                  <MessageSquare size={13} />
                </button>
              </>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 transition"
                title="Email Parent"
              >
                <Mail size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN: Personal + Academic Combined (65% / lg:col-span-2) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Combined Profile Container */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          
          {/* Section: Personal Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
              Personal Profile
            </h3>
            <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailItem label="Full Name" value={student.fullName} />
              <DetailItem label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"} />
              <DetailItem label="Gender" value={student.gender} />
              <DetailItem label="Blood Group" value={student.bloodGroup} />
              <DetailItem label="Contact Number" value={student.phone} />
              <DetailItem label="Email Address" value={student.email} />
              <div className="sm:col-span-2">
                <DetailItem label="Residential Address" value={address} />
              </div>
            </div>
          </div>

          {/* Section: Academic Details */}
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
              Academic Information
            </h3>
            <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailItem label="Student Code" value={<span className="font-mono text-blue-600 dark:text-blue-400">{student.studentCode}</span>} />
              <DetailItem label="Assigned Standard" value={student.standard?.name} />
              <DetailItem label="Academic Year" value={student.academicYear} />
              <DetailItem label="Joining Date" value={student.joiningDate ? new Date(student.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"} />
              <DetailItem label="Current Enrollment Batches" value={student.currentBatch?.name} />
              <DetailItem label="Category / Tier" value={student.category} />
              <DetailItem label="Referred By" value={student.referredBy} />
              <DetailItem label="Previous Institution" value={student.previousSchool} />
              <DetailItem label="Previous Academic Marks" value={student.previousMarks} />
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Parents, Emergency, Siblings, Medical (35% / lg:col-span-1) */}
      <div className="space-y-6">
        
        {/* Parent / Guardian Contact Cards */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
            Parents & Guardians
          </h3>
          <div className="space-y-3">
            {student.parent ? (
              <>
                {renderParentCard(
                  student.parent.fatherName,
                  student.parent.fatherPhone,
                  student.parent.fatherEmail,
                  "Father",
                  student.parent.fatherOccup,
                  student.parent.primaryContact === "FATHER"
                )}
                {renderParentCard(
                  student.parent.motherName,
                  student.parent.motherPhone,
                  student.parent.motherEmail,
                  "Mother",
                  student.parent.motherOccup,
                  student.parent.primaryContact === "MOTHER"
                )}
                {renderParentCard(
                  student.parent.guardianName,
                  student.parent.guardianPhone,
                  student.parent.guardianPhone ? student.email : null, // Fallback
                  `Guardian (${student.parent.guardianRel ?? "Other"})`,
                  null,
                  student.parent.primaryContact === "GUARDIAN"
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-450 dark:border-slate-800">
                <Users size={20} className="mx-auto mb-2 text-slate-350" />
                No parent details registered.
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
            Emergency Contacts
          </h3>
          {student.emergencyContacts && student.emergencyContacts.length > 0 ? (
            <div className="space-y-2.5">
              {student.emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between rounded-lg bg-slate-50/50 border border-slate-150 p-2.5 dark:bg-slate-950/20 dark:border-slate-800/60 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-250">{contact.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{contact.relationship}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${contact.phone}`} className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 transition">
                      <Phone size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-450 dark:border-slate-850">
              <ShieldAlert size={20} className="mx-auto mb-2 text-slate-350" />
              No emergency contacts added.
            </div>
          )}
        </div>

        {/* Siblings Placeholder (Compact Empty State) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
            Siblings
          </h3>
          {student.siblings.length || student.siblingOf.length ? (
            <div className="space-y-2.5">
              {student.siblings.map((link) => (
                <div key={link.siblingId} className="flex items-center justify-between rounded-lg bg-slate-50/50 border border-slate-150 p-2.5 dark:bg-slate-950/20 dark:border-slate-800/60 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-205">{link.sibling.firstName} {link.sibling.lastName}</p>
                    <p className="font-mono text-[10px] text-slate-400">{link.sibling.studentCode}</p>
                  </div>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                    {link.sibling.status}
                  </span>
                </div>
              ))}
              {student.siblingOf.map((link) => (
                <div key={link.studentId} className="flex items-center justify-between rounded-lg bg-slate-50/50 border border-slate-150 p-2.5 dark:bg-slate-950/20 dark:border-slate-800/60 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-205">{link.student.firstName} {link.student.lastName}</p>
                    <p className="font-mono text-[10px] text-slate-400">{link.student.studentCode}</p>
                  </div>
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                    {link.student.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2.5 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              No siblings linked in records
            </div>
          )}
        </div>

        {/* Medical Info Section (Section 11: Compact Auto-height Empty State) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 border-b border-slate-100 pb-2.5 dark:border-slate-800/80">
            Medical Alerts
          </h3>
          {student.medicalInfo && (student.medicalInfo.allergies || student.medicalInfo.conditions || student.medicalInfo.medications) ? (
            <div className="space-y-3 text-xs">
              {student.medicalInfo.allergies && (
                <div>
                  <p className="font-bold text-rose-650 dark:text-rose-455 flex items-center gap-1">
                    <AlertCircle size={12} /> Allergies
                  </p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">{student.medicalInfo.allergies}</p>
                </div>
              )}
              {student.medicalInfo.conditions && (
                <div>
                  <p className="font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                    <ShieldAlert size={12} /> Medical Conditions
                  </p>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">{student.medicalInfo.conditions}</p>
                </div>
              )}
              {student.medicalInfo.doctorName && (
                <div className="mt-2.5 rounded bg-slate-55 bg-slate-50/50 p-2 dark:bg-slate-950/20 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-slate-800/60">
                  <p className="font-bold text-slate-700 dark:text-slate-350">Doctor: {student.medicalInfo.doctorName}</p>
                  {student.medicalInfo.doctorPhone && <p className="mt-0.5">Phone: {student.medicalInfo.doctorPhone}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="py-2.5 text-center text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1">
              <Heart size={12} className="text-slate-300" />
              No active medical warnings
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OverviewTab;
