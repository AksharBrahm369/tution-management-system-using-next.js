/**
 * TuitionPro - Shared Utility Functions
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { NextRequest } from "next/server";
import { format as formatDateFns } from "date-fns";

// ─── Tailwind Class Merger ────────────────────────────────────────────────────

/**
 * Merges Tailwind CSS class names with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

/**
 * Creates a standardized JSON success response.
 */
export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200
): Response {
  return Response.json({ success: true, message, data }, { status });
}

/**
 * Creates a standardized JSON error response.
 */
export function errorResponse(
  message: string,
  status = 400,
  errors?: Record<string, string[]>
): Response {
  return Response.json(
    { success: false, message, ...(errors && { errors }) },
    { status }
  );
}

// ─── Request Helpers ──────────────────────────────────────────────────────────

/**
 * Extracts the client IP address from a Next.js request.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/**
 * Masks an email address for display (e.g. j***@example.com).
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const masked = local[0] + "***";
  return `${masked}@${domain}`;
}

/**
 * Formats a date to a human-readable string.
 */
export function formatDate(date: Date | string, formatStr: string = "dd MMM yyyy HH:mm"): string {
  try {
    return formatDateFns(new Date(date), formatStr);
  } catch {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  }
}

// ─── Password Strength ────────────────────────────────────────────────────────

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

interface PasswordStrengthResult {
  score: number; // 0–4
  label: PasswordStrength;
  color: string;
}

/**
 * Evaluates password strength and returns a score, label, and color.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Clamp to 0–4
  score = Math.min(score, 4);

  const levels: PasswordStrengthResult[] = [
    { score: 0, label: "weak", color: "#ef4444" },
    { score: 1, label: "weak", color: "#ef4444" },
    { score: 2, label: "fair", color: "#f97316" },
    { score: 3, label: "good", color: "#eab308" },
    { score: 4, label: "strong", color: "#22c55e" },
  ];

  return levels[score];
}
