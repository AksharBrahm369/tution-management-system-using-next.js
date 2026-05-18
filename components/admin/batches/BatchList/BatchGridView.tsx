"use client";

import React from "react";
import BatchCard from "./BatchCard";

interface Batch {
  id: string;
  name: string;
  code: string;
  color?: string | null;
  status: string;
  days: string[];
  startTime: string;
  endTime: string;
  maxStrength: number;
  currentStrength: number;
  fees: number;
  subject: { name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string };
  room?: { name: string } | null;
}

const BatchGridView: React.FC<{ batches: Batch[] }> = ({ batches }) => {
  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">No batches found</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Try adjusting your filters or create a new batch</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}
    </div>
  );
};

export default BatchGridView;
