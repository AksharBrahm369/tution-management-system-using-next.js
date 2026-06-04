"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeStudentCode = (value: string) =>
    value
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/\s+/g, "")
      .toUpperCase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const normalizedStudentCode = normalizeStudentCode(studentCode);
      const res = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode: normalizedStudentCode, password, rememberMe: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to login");
      }

      router.push("/student/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            Sign in using your Student Code
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="studentCode" className="sr-only">Student Code</label>
              <input
                id="studentCode"
                name="studentCode"
                type="text"
                required
                className="relative block w-full rounded-xl border-0 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-cyan-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6 px-3"
                placeholder="Student Code (e.g., STU-2026-001)"
                value={studentCode}
                onChange={(e) => setStudentCode(normalizeStudentCode(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-xl border-0 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-cyan-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-cyan-600 px-3 py-3 text-sm font-semibold text-white hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
