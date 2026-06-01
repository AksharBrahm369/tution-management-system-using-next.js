/**
 * TuitionPro - Global TypeScript Types & Interfaces
 * Module 1: Authentication & User Management
 */

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
}

// ─── User Types ───────────────────────────────────────────────────────────────

/**
 * Safe user object (no password field) for client-side consumption.
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatar: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: SafeUser;
  token: string;
}

export interface RegisterResponse {
  user: SafeUser;
}

export interface MeResponse {
  user: SafeUser;
}

// ─── Session Types ────────────────────────────────────────────────────────────

export interface SessionData {
  userId: string;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

// ─── Form State Types ─────────────────────────────────────────────────────────

export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  lastLogin: Date | null;
}

// ─── Route Guard Types ────────────────────────────────────────────────────────

export type AllowedRole = Role | Role[];

export interface RouteGuardConfig {
  allowedRoles: Role[];
  redirectTo: string;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
