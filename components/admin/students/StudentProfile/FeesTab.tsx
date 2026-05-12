import React from "react";
import { StudentProfileData } from "../types";

interface FeesTabProps {
  student: StudentProfileData;
}

const FeesTab: React.FC<FeesTabProps> = ({ student }) => {
  const totalPaid = student.feeRecords.filter((record) => record.status === "PAID").reduce((sum, record) => sum + record.amount, 0);
  const totalDue = student.feeRecords.filter((record) => record.status !== "PAID").reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fee module coming soon</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Total fees due</p><p className="mt-2 text-2xl font-bold">₹ {totalDue.toLocaleString("en-IN")}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Total paid</p><p className="mt-2 text-2xl font-bold">₹ {totalPaid.toLocaleString("en-IN")}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Pending amount</p><p className="mt-2 text-2xl font-bold">₹ {student.pendingFees.toLocaleString("en-IN")}</p></div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs uppercase text-slate-500">Last payment</p><p className="mt-2 text-2xl font-bold">{student.feeRecords[0]?.paidAt ? new Date(student.feeRecords[0].paidAt).toLocaleDateString() : "N/A"}</p></div>
      </div>
    </div>
  );
};

export default FeesTab;
