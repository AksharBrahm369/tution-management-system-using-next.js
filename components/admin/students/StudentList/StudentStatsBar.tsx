import React from "react";

interface StudentStatsBarProps {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
}

const pillBase = "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border";

const StudentStatsBar: React.FC<StudentStatsBarProps> = ({ total, active, inactive, onLeave }) => {
  const items = [
    { label: "Total", value: total, className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
    { label: "Active", value: active, className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40" },
    { label: "Inactive", value: inactive, className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700" },
    { label: "On Leave", value: onLeave, className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40" },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <div key={item.label} className={`${pillBase} ${item.className}`}>
          <span>{item.label}</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-900 dark:bg-white/10 dark:text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StudentStatsBar;
