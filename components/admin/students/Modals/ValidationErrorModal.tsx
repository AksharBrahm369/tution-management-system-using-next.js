"use client";

import React from "react";
import { X, AlertTriangle } from "lucide-react";

interface ValidationErrorModalProps {
  errors: Array<{ field: string; message: string }>;
  onClose: () => void;
}

const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({ errors, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mb-3 shadow-inner">
            <AlertTriangle size={24} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Validation Errors
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Please fix the following issues to proceed:
          </p>
        </div>

        {/* Errors List */}
        <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          {errors.map((err, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-2xl bg-rose-50/40 p-3.5 text-rose-950 border border-rose-100/50 dark:bg-rose-950/20 dark:text-rose-200 dark:border-rose-900/30 transition-all hover:bg-rose-50/70 dark:hover:bg-rose-950/30"
            >
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-semibold text-rose-900 dark:text-rose-300">
                  {err.field}
                </span>
                <span className="text-xs text-rose-800/80 dark:text-rose-400/90 leading-relaxed">
                  {err.message}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-100 px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md active:scale-[0.98]"
          >
            Review & Fix
          </button>
        </div>

      </div>
    </div>
  );
};

export default ValidationErrorModal;
