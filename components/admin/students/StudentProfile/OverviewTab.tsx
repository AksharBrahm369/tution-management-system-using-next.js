import React from "react";
import { StudentProfileData } from "../types";

interface OverviewTabProps {
  student: StudentProfileData;
}

function card(title: string, content: React.ReactNode) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">{content}</div>
    </div>
  );
}

const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {card("Personal Details", <div className="space-y-2"><p><strong>Name:</strong> {student.fullName}</p><p><strong>DOB:</strong> {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}</p><p><strong>Gender:</strong> {student.gender}</p><p><strong>Blood Group:</strong> {student.bloodGroup ?? "N/A"}</p><p><strong>Phone:</strong> {student.phone ?? "N/A"}</p><p><strong>Email:</strong> {student.email ?? "N/A"}</p><p><strong>Address:</strong> {student.addressLine1 ?? ""} {student.addressLine2 ?? ""} {student.city ?? ""} {student.state ?? ""} {student.pincode ?? ""}</p></div>)}
      {card("Academic Details", <div className="space-y-2"><p><strong>Student Code:</strong> {student.studentCode}</p><p><strong>Standard:</strong> {student.standard?.name ?? "No standard assigned"}</p><p><strong>Academic Year:</strong> {student.academicYear}</p><p><strong>Joining Date:</strong> {new Date(student.joiningDate).toLocaleDateString()}</p><p><strong>Category:</strong> {student.category}</p><p><strong>Referred By:</strong> {student.referredBy ?? "N/A"}</p><p><strong>Previous School:</strong> {student.previousSchool ?? "N/A"}</p><p><strong>Previous Marks:</strong> {student.previousMarks ?? "N/A"}</p><p><strong>Current Batches:</strong> {student.currentBatch?.name ?? "No batch assigned"}</p></div>)}
      {card("Parent Details", <div className="space-y-2"><p><strong>Father:</strong> {student.parent?.fatherName ?? "N/A"} {student.parent?.fatherPhone ? `(${student.parent.fatherPhone})` : ""}</p><p><strong>Mother:</strong> {student.parent?.motherName ?? "N/A"} {student.parent?.motherPhone ? `(${student.parent.motherPhone})` : ""}</p><p><strong>Guardian:</strong> {student.parent?.guardianName ?? "N/A"}</p><p><strong>Primary Contact:</strong> {student.parent?.primaryContact ?? "N/A"}</p></div>)}

      <div className="xl:col-span-3 grid gap-6 lg:grid-cols-3">
        {card("Emergency Contacts", <div className="space-y-3">{student.emergencyContacts.map((contact) => <div key={contact.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p><p className="text-sm text-slate-600 dark:text-slate-300">{contact.relationship} • {contact.phone}</p></div>)}</div>)}
        {card("Medical Info", student.medicalInfo ? <div className="space-y-2"><p><strong>Allergies:</strong> {student.medicalInfo.allergies ?? "N/A"}</p><p><strong>Medications:</strong> {student.medicalInfo.medications ?? "N/A"}</p><p><strong>Conditions:</strong> {student.medicalInfo.conditions ?? "N/A"}</p><p><strong>Doctor:</strong> {student.medicalInfo.doctorName ?? "N/A"}</p><p><strong>Doctor Phone:</strong> {student.medicalInfo.doctorPhone ?? "N/A"}</p></div> : <p>No medical information provided.</p>)}
        {card("Siblings", student.siblings.length || student.siblingOf.length ? <div className="space-y-2">{student.siblings.map((link) => <div key={link.siblingId} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="font-semibold text-slate-900 dark:text-white">{link.sibling.firstName} {link.sibling.lastName}</p><p className="text-sm text-slate-600 dark:text-slate-300">{link.sibling.studentCode}</p></div>)}{student.siblingOf.map((link) => <div key={link.studentId} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="font-semibold text-slate-900 dark:text-white">{link.student.firstName} {link.student.lastName}</p><p className="text-sm text-slate-600 dark:text-slate-300">{link.student.studentCode}</p></div>)}</div> : <p>No sibling links yet.</p>)}
      </div>
    </div>
  );
};

export default OverviewTab;
