import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/shared/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Lock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your TuitionPro account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60">
          {/* Header band */}
          <div className="auth-gradient px-8 py-6">
            <Logo variant="light" size="md" />
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Reset Password</h1>
                <p className="text-xs text-slate-500">Create a strong new password</p>
              </div>
            </div>

            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-8 py-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              All existing sessions will be terminated after reset
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
