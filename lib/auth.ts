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
import { prisma } from "@/lib/prisma";
import { setRequestInstitute } from "@/lib/institute";

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
  instituteId: string;
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
  instituteId: string,
  role: Role,
  email: string,
  rememberMe = false
): Promise<string> {
  const expiresIn = rememberMe ? REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN;

  const token = await new SignJWT({ userId, instituteId, role, email })
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
): Promise<{ id: string; userId: string; instituteId: string; role: Role; email: string } | null> {
  try {
    const session = await requireInstituteSession();
    return {
      id: session.userId,
      userId: session.userId,
      instituteId: session.instituteId,
      role: session.role,
      email: session.email,
    };
  } catch {
    return null;
  }
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

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
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
    const payload = await verifyToken(token);
    if (!payload?.userId || !payload.instituteId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { instituteId: true, isActive: true },
    });

    if (!user?.isActive || user.instituteId !== payload.instituteId) {
      return null;
    }

    setRequestInstitute(payload.instituteId);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Retrieves, verifies, and requires a valid session with an isolated institute.
 * Throws an error if unauthorized, inactive, or not scoped to an institute.
 */
export async function requireInstituteSession(): Promise<{
  userId: string;
  role: Role;
  instituteId: string;
  email: string;
}> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized: No active session");
  }
  if (!session.userId || !session.role || !session.instituteId) {
    throw new Error("Unauthorized: Invalid institute session");
  }
  setRequestInstitute(session.instituteId);
  return {
    userId: session.userId,
    role: session.role,
    instituteId: session.instituteId,
    email: session.email,
  };
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
