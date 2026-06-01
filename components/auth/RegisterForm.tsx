"use client";

/**
 * TuitionPro - Register Form Component
 *
 * Creates the initial SUPER_ADMIN account.
 * Features:
 * - Full name, email, phone, password, confirm password fields
 * - Password strength meter
 * - Show/hide password toggle
 * - Role field (disabled — always SUPER_ADMIN)
 * - Zod validation via React Hook Form
 * - Loading state + success redirect
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { registerSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { getPasswordStrength } from "@/lib/utils";

type RegisterValues = z.infer<typeof registerSchema>;

// ─── Password Strength Bar ────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getPasswordStrength(password);
  const bars = [0, 1, 2, 3];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {bars.map((bar) => (
          <div
            key={bar}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: bar < score ? color : "#e2e8f0",
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium capitalize" style={{ color }}>
        {label} password
      </p>
    </div>
  );
}

// ─── Field Error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

import { useEffect } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminExists, setAdminExists] = useState(false);
  const [existingEmail, setExistingEmail] = useState("");

  useEffect(() => {
    fetch("/api/auth/register")
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success && resJson.data?.exists) {
          setAdminExists(true);
          setExistingEmail(resJson.data.email || "");
        }
      })
      .catch((err) => console.error("Error checking register status:", err));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "SUPER_ADMIN" as const },
  });

  const watchedPassword = watch("password", "");

  const onSubmit = async (data: RegisterValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccessMessage("Admin account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {adminExists && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-150 bg-indigo-50/50 p-5 dark:border-indigo-900/30 dark:bg-indigo-950/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Super Admin Already Configured
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-350">
                An administrator account is already set up in the database{existingEmail ? ` (${existingEmail})` : ""}. Please sign in to access the system.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/20"
          >
            Go to Sign In Page
          </Link>
        </div>
      )}

      {/* Server error */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Role Badge (read-only) */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Super Administrator</p>
          <p className="text-xs text-blue-600">This account will have full system access</p>
        </div>
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="John Smith"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
            errors.name ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@tuitionpro.com"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
            errors.email ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Phone Number <span className="text-slate-400">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+919876543210"
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
            errors.phone ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a strong password"
            className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.password ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthBar password={watchedPassword} />
        <FieldError message={errors.password?.message} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
            }`}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      {/* Hidden role */}
      <input type="hidden" {...register("role")} value="SUPER_ADMIN" />

      {/* Submit */}
      <button
        id="register-submit"
        type="submit"
        disabled={isSubmitting || !!successMessage}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Create Admin Account
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm;
