/**
 * TuitionPro - Zod Validation Schemas for Authentication
 *
 * Uses Zod v4 with React Hook Form v7 compatible type exports.
 * Defaults for optional fields are handled in useForm({ defaultValues }).
 */

import { z } from "zod";

// ─── Password Rules ───────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// ─── Login Schema ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Explicit form data type (always has rememberMe as boolean for submit handler)
export type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

// ─── Register Schema ──────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Name is too long")
      .trim(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{9,14}$/, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.literal("SUPER_ADMIN").optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Explicit form data type
export type RegisterFormData = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  role: "SUPER_ADMIN";
};

// ─── Forgot Password Schema ───────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password Schema ────────────────────────────────────────────────────

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── API-side schemas (re-export for route handlers) ─────────────────────────

export const loginApiSchema = loginSchema;
export const registerApiSchema = registerSchema;
export const forgotPasswordApiSchema = forgotPasswordSchema;
export const resetPasswordApiSchema = resetPasswordSchema;
