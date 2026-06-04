"use client";

import React from "react";
import { Users, Activity, Clock, TrendingUp, BookOpen } from "lucide-react";

interface Stats {
  total: number;
  ongoing: number;
  upcoming: number;
  completed: number;
  totalEnrolled: number;
}

const BatchStatsBar: React.FC<{ stats: Stats }> = ({ stats }) => {
  const pills = [
    { label: "Total Batches", value: stats.total, color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: <BookOpen size={14} /> },
    { label: "Ongoing", value: stats.ongoing, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300", icon: <Activity size={14} /> },
    { label: "Upcoming", value: stats.upcoming, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400", icon: <Clock size={14} /> },
    { label: "Completed", value: stats.completed, color: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400", icon: <TrendingUp size={14} /> },
    { label: "Total Enrolled", value: stats.totalEnrolled, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400", icon: <Users size={14} /> },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${pill.color}`}
        >
          {pill.icon}
          <span>{pill.label}:</span>
          <span className="font-bold">{pill.value}</span>
        </div>
      ))}
    </div>
  );
};

export default BatchStatsBar;
