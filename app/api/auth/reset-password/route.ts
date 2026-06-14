/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token, checks expiry, hashes the new password,
 * updates the user record, and invalidates all existing sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, clearAuthCookie } from "@/lib/auth";
import { resetPasswordApiSchema } from "@/lib/validations/auth";
import { errorResponse } from "@/lib/utils";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { setRequestInstitute, withoutAuthScope } from "@/lib/institute";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
  try {
    // ── 1. Parse & validate ───────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = resetPasswordApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return errorResponse("Validation failed", 422, errors);
    }

    const { token, password } = parsed.data;

    // ── 2. Find & validate reset token ────────────────────────────────────────
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.isUsed) {
      return errorResponse("This reset link is invalid or expired", 400);
    }

    if (resetRecord.expiresAt < new Date()) {
      return errorResponse("This reset link is invalid or expired", 400);
    }

    // ── 3. Find user ──────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      return errorResponse("This reset link is invalid or expired", 400);
    }

    if (user.instituteId) setRequestInstitute(user.instituteId);

    // ── 4. Hash new password & update user ────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      // Update password
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      // Invalidate reset token
      prisma.passwordResetToken.update({
        where: { token },
        data: { isUsed: true },
      }),
      // Invalidate all sessions (force re-login everywhere)
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    // ── 5. Log activity ───────────────────────────────────────────────────────
    await logActivityFromRequest(request, {
      userId: user.id,
      action: "PASSWORD_CHANGED",
      category: "AUTH",
      severity: "INFO",
      description: "Password reset completed successfully",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
    });

    // ── 6. Clear cookie if user is currently logged in ────────────────────────
    const response = NextResponse.json(
      { success: true, message: "Password reset successfully. Please login with your new password.", data: null },
      { status: 200 }
    );

    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
  });
}
