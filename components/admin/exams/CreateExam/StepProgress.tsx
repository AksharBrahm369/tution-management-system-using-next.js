import React from "react";

const labels = ["Exam Details", "Marks Config", "Question Setup", "Review"];

export default function StepProgress({ step }: { step: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {labels.map((label, index) => (
        <div key={label} className={`rounded-xl border p-3 text-sm font-medium ${step === index + 1 ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "border-slate-200 dark:border-slate-800"}`}>
          {index + 1}. {label}
        </div>
      ))}
    </div>
  );
}
