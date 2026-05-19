/**
 * TuitionPro - Authentication Utilities
 *
 * Provides JWT generation/verification, password hashing,
 * reset token generation, and HTTP-only cookie management.
 */

import bcryptjs from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-for-dev-only-replace-in-production"
);
const JWT_EXPIRES_IN = "7d";
const REMEMBER_ME_EXPIRES_IN = "30d";
const COOKIE_NAME = "tuitionpro_auth";
const BCRYPT_SALT_ROUNDS = 12;
const RESET_TOKEN_BYTES = 32;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPayload extends JWTPayload {
  userId: string;
  role: Role;
  email: string;
}

export interface AuthCookieOptions {
  rememberMe?: boolean;
}

// ─── JWT Utilities ────────────────────────────────────────────────────────────

/**
 * Generates a signed JWT token containing user identity and role.
 */
export async function generateToken(
  userId: string,
  role: Role,
  email: string,
  rememberMe = false
): Promise<string> {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;

  const token = await new SignJWT({ userId, role, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setSubject(userId)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws on invalid or expired tokens.
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Reads and verifies the auth cookie from a request.
 * Returns null when the request is unauthenticated or invalid.
 */
export async function validateJWT(
  request: NextRequest
): Promise<TokenPayload | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Backward-compatible route helper.
 * Returns normalized user fields expected by older route handlers.
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ id: string; userId: string; role: Role; email: string } | null> {
  const payload = await validateJWT(request);
  if (!payload) return null;

  return {
    id: payload.userId,
    userId: payload.userId,
    role: payload.role,
    email: payload.email,
  };
}

// ─── Password Utilities ───────────────────────────────────────────────────────

/**
 * Hashes a plain-text password using bcryptjs with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a bcrypt hash.
 */
export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcryptjs.compare(plain, hashed);
}

// ─── Reset Token ──────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure URL-safe reset token.
 */
export function generateResetToken(): string {
  const array = new Uint8Array(RESET_TOKEN_BYTES);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// ─── Cookie Utilities ─────────────────────────────────────────────────────────

/**
 * Sets the HTTP-only auth cookie on a NextResponse object.
 * Used in API route handlers.
 */
export function setAuthCookie(
  response: NextResponse,
  token: string,
  rememberMe = false
): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // seconds

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

/**
 * Clears the auth cookie (sets it with an immediate expiry).
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Reads the auth token from server-side cookies (Server Components / RSC).
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Retrieves and verifies the current session from the auth cookie.
 * Returns null when no valid session exists.
 */
export async function getCurrentSession(): Promise<TokenPayload | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// ─── Role Redirect Mapping ────────────────────────────────────────────────────

/**
 * Returns the dashboard path for a given role.
 */
export function getRoleDashboardPath(role: Role): string {
  const paths: Record<Role, string> = {
    SUPER_ADMIN: "/admin/dashboard",
    TEACHER: "/teacher/dashboard",
    STUDENT: "/student/dashboard",
    PARENT: "/parent/dashboard",
  };
  return paths[role];
}
