/**
 * POST /api/auth/login
 *
 * Authenticates a user, creates a DB session, sets an HTTP-only JWT cookie,
 * updates lastLogin, and logs the activity.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";
import { loginApiSchema } from "@/lib/validations/auth";
import { errorResponse, getClientIp } from "@/lib/utils";

// Simple in-memory rate limiter (use Redis in production)
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (record) {
    if (now < record.resetAt && record.count >= MAX_ATTEMPTS) {
      return false; // Rate limited
    }
    if (now >= record.resetAt) {
      failedAttempts.delete(identifier);
    }
  }
  return true;
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (record && now < record.resetAt) {
    record.count++;
  } else {
    failedAttempts.set(identifier, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION_MS,
    });
  }
}

function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // ── 1. Rate limit check ───────────────────────────────────────────────────
    if (!checkRateLimit(ip)) {
      return errorResponse(
        "Too many failed attempts. Please try again in 15 minutes.",
        429
      );
    }

    // ── 2. Parse & validate request body ─────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = loginApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return errorResponse("Validation failed", 422, errors);
    }

    const { email, password, rememberMe } = parsed.data;

    // ── 3. Find user ──────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      recordFailedAttempt(ip);
      return errorResponse("Invalid email or password", 401);
    }

    // ── 4. Check account status ───────────────────────────────────────────────
    if (!user.isActive) {
      return errorResponse("Your account has been deactivated", 403);
    }

    // ── 5. Verify password ────────────────────────────────────────────────────
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(ip);
      return errorResponse("Invalid email or password", 401);
    }

    // ── 6. Generate JWT ───────────────────────────────────────────────────────
    clearFailedAttempts(ip);
    const token = await generateToken(user.id, user.role, user.email, rememberMe);

    // ── 7. Persist session in DB ──────────────────────────────────────────────
    const sessionExpiry = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: sessionExpiry,
      },
    });

    // ── 8. Update last login ──────────────────────────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // ── 9. Log activity ───────────────────────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        details: `Logged in${rememberMe ? " with Remember Me" : ""}`,
        ipAddress: ip,
      },
    });

    // ── 10. Build response & set cookie ───────────────────────────────────────
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const response = NextResponse.json(
      { success: true, message: "Login successful", data: { user: safeUser } },
      { status: 200 }
    );

    setAuthCookie(response, token, rememberMe);
    return response;
  } catch (error) {
    console.error("[LOGIN]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
