/**
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCredentialAccount } from "@/lib/betterAuthAccounts";
import { appendAuthCookies, signInWithBetterAuth } from "@/lib/betterAuthRoute";
import { ensureUserInstitute } from "@/lib/instituteProvisioning";
import { setRequestInstitute, withoutAuthScope } from "@/lib/institute";
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
  return withoutAuthScope(async () => {
    try {
      const ip = getClientIp(request);

      if (!checkRateLimit(ip)) {
        await logActivityFromRequest(request, {
          action: "ACCOUNT_LOCKED",
          category: "AUTH",
          severity: "CRITICAL",
          description: "Login blocked - too many failed attempts from this IP",
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
        const errors = parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >;
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
        if (user.instituteId) setRequestInstitute(user.instituteId);
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

      const instituteId = await ensureUserInstitute(user);
      await ensureCredentialAccount(user.id, user.password);

      let signInResult: Awaited<ReturnType<typeof signInWithBetterAuth>>;
      try {
        signInResult = await signInWithBetterAuth(
          request,
          { email, password, rememberMe: rememberMe ?? false },
          instituteId
        );
      } catch {
        if (user.instituteId) setRequestInstitute(user.instituteId);
        const attempts = recordFailedAttempt(ip);
        await logActivityFromRequest(request, {
          userId: user.id,
          action: "LOGIN_FAILED",
          category: "AUTH",
          severity: "WARNING",
          description: `Login failed - wrong password for ${email}`,
          isSuccessful: false,
          errorMessage: "Invalid email or password",
          metadata: { attempts, ip },
        });
        return errorResponse("Invalid email or password", 401);
      }

      clearFailedAttempts(ip);
      setRequestInstitute(instituteId);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), instituteId },
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
        id: updatedUser.id,
        instituteId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        isActive: updatedUser.isActive,
        isVerified: updatedUser.isVerified,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      const response = NextResponse.json(
        { success: true, message: "Login successful", data: { user: safeUser } },
        { status: 200 }
      );

      appendAuthCookies(response, signInResult.headers);
      return response;
    } catch (error) {
      console.error("[LOGIN]", error);
      return errorResponse("Something went wrong. Please try again", 500);
    }
  });
}
