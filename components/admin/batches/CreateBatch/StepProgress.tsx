"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const defaultLabels = ["Batch Details", "Schedule", "Students", "Review"];

const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  labels = defaultLabels,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "border-2 border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={18} /> : step}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    isCurrent
                      ? "text-blue-600 dark:text-blue-400"
                      : isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {labels[i] ?? `Step ${step}`}
                </span>
              </div>
              {step < totalSteps && (
                <div
                  className={`h-0.5 flex-1 mx-3 transition-all ${
                    isCompleted ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
