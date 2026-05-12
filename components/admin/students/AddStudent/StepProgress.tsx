import React from "react";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between gap-3">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                    isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isCurrent
                        ? "border-blue-600 bg-white text-blue-600 dark:bg-slate-950"
                        : "border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Step {stepNumber}</span>
              </div>
              {stepNumber < totalSteps && (
                <div className={`mb-6 h-1 flex-1 rounded-full ${stepNumber < currentStep ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
