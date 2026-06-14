"use client";

/**
 * TuitionPro - Login Form Component
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { type SafeUser } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const redirectUrl = searchParams.get("redirect") ?? searchParams.get("callbackUrl");
  const safeRedirectUrl =
    redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")
      ? redirectUrl
      : null;
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
        safeRedirectUrl ?? ROLE_REDIRECT[user.role] ?? "/admin/dashboard";

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
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={cn(
            "tp-input",
            errors.email && "border-red-400 bg-red-50/80 focus:ring-red-500/20 dark:bg-red-950/20"
          )}
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
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={cn(
              "tp-input pr-12",
              errors.password && "border-red-400 bg-red-50/80 focus:ring-red-500/20 dark:bg-red-950/20"
            )}
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
            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            {...register("rememberMe")}
          />
          Remember me for 30 days
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
        >
          Forgot password?
        </Link>
      </div>

      <Button id="login-submit" type="submit" disabled={isSubmitting} isLoading={isSubmitting} size="lg" className="w-full">
        {!isSubmitting && (
          <>
            <LogIn className="h-4 w-4" />
            Sign In to TuitionPro
          </>
        )}
      </Button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Setting up for the first time?{" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
        >
          Create Admin Account
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
