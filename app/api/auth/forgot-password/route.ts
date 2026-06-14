/**
 * POST /api/auth/forgot-password
 *
 * Validates the email, generates a secure reset token,
 * stores it in the DB, and returns the reset URL.
 * (Email sending is stubbed — plug in your email provider here.)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken } from "@/lib/auth";
import { forgotPasswordApiSchema } from "@/lib/validations/auth";
import { errorResponse, successResponse, maskEmail } from "@/lib/utils";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { getAppUrl } from "@/lib/appUrl";
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

    const parsed = forgotPasswordApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return errorResponse("Validation failed", 422, errors);
    }

    const { email } = parsed.data;

    // ── 2. Check user exists ──────────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { email } });

    // Security: always return the same response whether email exists or not
    // to prevent email enumeration attacks.
    if (!user || !user.isActive) {
      return successResponse(
        { maskedEmail: email.includes("@") ? maskEmail(email) : email },
        "If this email is registered, you will receive a reset link shortly."
      );
    }

    if (user.instituteId) setRequestInstitute(user.instituteId);

    // ── 3. Invalidate any existing tokens for this email ──────────────────────
    await prisma.passwordResetToken.updateMany({
      where: { email, isUsed: false },
      data: { isUsed: true },
    });

    // ── 4. Generate & store reset token (expires in 1 hour) ───────────────────
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    // ── 5. Construct reset URL ────────────────────────────────────────────────
    const appUrl = getAppUrl(request);
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // ── 6. Send email (plug in your provider — Resend, Nodemailer, etc.) ──────
    // TODO: Replace this block with your chosen email provider
    console.info(`[FORGOT_PASSWORD] Reset URL for ${email}: ${resetUrl}`);
    // await sendResetEmail({ to: email, name: user.name, resetUrl });

    // ── 7. Log activity ───────────────────────────────────────────────────────
    await logActivityFromRequest(request, {
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      category: "AUTH",
      severity: "INFO",
      description: "Password reset requested",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
    });

    return successResponse(
      { maskedEmail: maskEmail(email) },
      "If this email is registered, you will receive a reset link shortly."
    );
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
  });
}
