"use client";

import React, { useState } from "react";
import { X, Copy, Check, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface CredentialsModalProps {
  title: string;
  studentCode: string;
  email: string;
  password: string;
  onClose: () => void;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  title,
  studentCode,
  email,
  password,
  onClose,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`${fieldName} copied to clipboard`);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        toast.error("Failed to copy text");
      }
    } else {
      toast.error("Clipboard not supported on this browser");
    }
  };

  const handleCopyAll = async () => {
    const textToCopy = `Student Code: ${studentCode}\nLogin Email: ${email}\nTemporary Password: ${password}`;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedField("all");
        toast.success("All credentials copied to clipboard");
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        toast.error("Failed to copy text");
      }
    } else {
      toast.error("Clipboard not supported on this browser");
    }
  };

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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 mb-3 shadow-inner">
            <KeyRound size={24} className="animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Credentials Generated
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            {title}
          </p>
        </div>

        {/* Credentials Box */}
        <div className="space-y-4">
          {/* Student Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Code
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span className="flex-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 select-all">
                {studentCode}
              </span>
              <button
                onClick={() => handleCopy(studentCode, "Student Code")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                title="Copy Student Code"
              >
                {copiedField === "Student Code" ? (
                  <Check size={16} className="text-emerald-500 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Login Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Login Email
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <span className="flex-1 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 select-all truncate">
                {email}
              </span>
              <button
                onClick={() => handleCopy(email, "Login Email")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                title="Copy Login Email"
              >
                {copiedField === "Login Email" ? (
                  <Check size={16} className="text-emerald-500 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Temporary Password
            </label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <input
                type={showPassword ? "text" : "password"}
                readOnly
                value={password}
                className="flex-1 bg-transparent font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none select-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopy(password, "Password")}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                title="Copy Password"
              >
                {copiedField === "Password" ? (
                  <Check size={16} className="text-emerald-500 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="mt-5 flex gap-2.5 rounded-2xl bg-amber-50/50 p-3.5 text-xs text-amber-800 border border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-500" />
          <span className="leading-relaxed">
            Please share these credentials securely with the student. This temporary password will only be shown once.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <button
            onClick={handleCopyAll}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
          >
            {copiedField === "all" ? (
              <>
                <Check size={16} className="animate-in zoom-in-75 duration-150" /> Copied All!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy All Credentials
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default CredentialsModal;
