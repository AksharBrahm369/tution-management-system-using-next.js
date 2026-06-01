/**
 * POST /api/auth/login
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
import { logActivityFromRequest } from "@/lib/activityLogger";

const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (record) {
    if (now < record.resetAt && record.count >= MAX_ATTEMPTS) {
      return false;
    }
    if (now >= record.resetAt) {
      failedAttempts.delete(identifier);
    }
  }
  return true;
}

function recordFailedAttempt(identifier: string): number {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (record && now < record.resetAt) {
    record.count++;
    return record.count;
  }

  failedAttempts.set(identifier, {
    count: 1,
    resetAt: now + LOCKOUT_DURATION_MS,
  });
  return 1;
}

function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      await logActivityFromRequest(request, {
        action: "ACCOUNT_LOCKED",
        category: "AUTH",
        severity: "CRITICAL",
        description: "Login blocked — too many failed attempts from this IP",
        isSuccessful: false,
        errorMessage: "Rate limited",
        metadata: { ip },
      });
      return errorResponse(
        "Too many failed attempts. Please try again in 15 minutes.",
        429
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = loginApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      return errorResponse("Validation failed", 422, errors);
    }

    const { email, password, rememberMe } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const attempts = recordFailedAttempt(ip);
      await logActivityFromRequest(request, {
        userName: email,
        action: "LOGIN_FAILED",
        category: "AUTH",
        severity: "WARNING",
        description: `Login failed for unknown email: ${email}`,
        isSuccessful: false,
        errorMessage: "Invalid email or password",
        metadata: { attempts, ip },
      });
      return errorResponse("Invalid email or password", 401);
    }

    if (!user.isActive) {
      await logActivityFromRequest(request, {
        userId: user.id,
        action: "LOGIN_FAILED",
        category: "AUTH",
        severity: "WARNING",
        description: `Login attempt on deactivated account: ${email}`,
        isSuccessful: false,
        errorMessage: "Account deactivated",
      });
      return errorResponse("Your account has been deactivated", 403);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      const attempts = recordFailedAttempt(ip);
      await logActivityFromRequest(request, {
        userId: user.id,
        action: "LOGIN_FAILED",
        category: "AUTH",
        severity: "WARNING",
        description: `Login failed — wrong password for ${email}`,
        isSuccessful: false,
        errorMessage: "Invalid email or password",
        metadata: { attempts, ip },
      });
      if (attempts >= MAX_ATTEMPTS) {
        await logActivityFromRequest(request, {
          userId: user.id,
          action: "ACCOUNT_LOCKED",
          category: "AUTH",
          severity: "CRITICAL",
          description: `Account temporarily locked after ${attempts} failed attempts`,
          isSuccessful: false,
          metadata: { ip },
        });
      }
      return errorResponse("Invalid email or password", 401);
    }

    clearFailedAttempts(ip);
    const token = await generateToken(user.id, user.role, user.email, rememberMe);

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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await logActivityFromRequest(request, {
      userId: user.id,
      action: "USER_LOGGED_IN",
      category: "AUTH",
      severity: "INFO",
      description: `User logged in${rememberMe ? " (remember me)" : ""}`,
      metadata: { rememberMe },
    });

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
