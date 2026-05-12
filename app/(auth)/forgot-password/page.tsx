import type { Metadata } from "next";
import { Logo } from "@/components/shared/Logo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { KeyRound, ShieldCheck, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your TuitionPro account password securely.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60">
          {/* Header band */}
          <div className="auth-gradient px-8 py-6">
            <Logo variant="light" size="md" />
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <KeyRound className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Forgot Password?</h1>
                <p className="text-xs text-slate-500">We&apos;ll send you a reset link</p>
              </div>
            </div>

            <ForgotPasswordForm />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-8 py-4">
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Secure reset
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Link expires in 1 hour
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
