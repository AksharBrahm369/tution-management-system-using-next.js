import type { Metadata } from "next";
import { Logo } from "@/components/shared/Logo";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Create Admin Account",
  description: "Create the initial Super Administrator account for TuitionPro.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="auth-gradient relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[40%]">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-white/5" />

        <div className="relative z-10 animate-fade-in">
          <Logo variant="light" size="lg" />
        </div>

        <div className="relative z-10 animate-slide-left space-y-6">
          <div className="space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white">
              Initial Setup
              <span className="block text-blue-200">Super Admin</span>
            </h1>
            <p className="max-w-xs text-sm text-blue-100/90">
              This page creates the first administrator account. Run this once
              during initial deployment.
            </p>
          </div>

          <div className="glass-card space-y-3 rounded-xl p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-semibold text-white">Important Notice</span>
            </div>
            <ul className="space-y-2 text-xs text-blue-100/80">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-yellow-300">•</span>
                Only one Super Admin can be created via this page
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-yellow-300">•</span>
                All other users are managed from the Admin Dashboard
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-yellow-300">•</span>
                Keep your credentials secure and backed up
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200/70">
          © {new Date().getFullYear()} TuitionPro. All rights reserved.
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md animate-slide-right">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">Create Admin Account</h2>
            <p className="text-sm text-slate-500">
              Set up the initial Super Administrator for TuitionPro
            </p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
