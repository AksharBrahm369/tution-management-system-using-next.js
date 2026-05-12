import React from "react";

interface QuickStatsBarProps {
  attendancePercent: number;
  feesPaid: number;
  pendingFees: number;
  examsTaken: number;
}

const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ attendancePercent, feesPaid, pendingFees, examsTaken }) => {
  const items = [
    { label: "Attendance", value: `${attendancePercent}%`, color: "from-blue-500 to-cyan-500" },
    { label: "Fees Paid", value: `₹ ${feesPaid.toLocaleString("en-IN")}`, color: "from-emerald-500 to-green-500" },
    { label: "Pending Fees", value: `₹ ${pendingFees.toLocaleString("en-IN")}`, color: "from-amber-500 to-orange-500" },
    { label: "Exams Taken", value: String(examsTaken), color: "from-fuchsia-500 to-purple-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${item.color}`} />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
};

export default QuickStatsBar;
