"use client";

/**
 * TuitionPro - Login Form Component
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { type SafeUser } from "@/types";

// Derive the form type directly from the schema so resolver types align
type LoginValues = z.infer<typeof loginSchema>;

const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const sessionExpired = searchParams.get("error") === "session_expired";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    sessionExpired ? "Session expired. Please login again." : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rememberMe: data.rememberMe ?? false }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setServerError(json.message ?? "Something went wrong. Please try again.");
        return;
      }

      const user: SafeUser = json.data.user;
      const destination =
        callbackUrl ?? ROLE_REDIRECT[user.role] ?? "/admin/dashboard";

      router.push(destination);
      router.refresh();
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Server error banner */}
      {serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

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
            errors.email
              ? "border-red-400 bg-red-50"
              : "border-slate-200 bg-slate-50 hover:border-slate-300"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            {errors.email.message}
          </p>
        )}
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
            autoComplete="current-password"
            placeholder="Enter your password"
            className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
              errors.password
                ? "border-red-400 bg-red-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
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
        {errors.password && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-blue-600"
            {...register("rememberMe")}
          />
          Remember me for 30 days
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        id="login-submit"
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign In to TuitionPro
          </>
        )}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-slate-500">
        Setting up for the first time?{" "}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Create Admin Account
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
