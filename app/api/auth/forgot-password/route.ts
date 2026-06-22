/**
 * POST /api/auth/forgot-password
 *
 * Requests a Better Auth password reset email while preserving the app's
 * existing response shape.
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/betterAuth";
import { forgotPasswordApiSchema } from "@/lib/validations/auth";
import { errorResponse, successResponse, maskEmail } from "@/lib/utils";
import { getAppUrl } from "@/lib/appUrl";
import { withoutAuthScope } from "@/lib/institute";
import { verifyPasswordResetEmailTransport } from "@/lib/passwordResetEmail";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
    try {
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
      const appUrl = getAppUrl(request);

      try {
        await verifyPasswordResetEmailTransport();
      } catch (error) {
        console.error("[FORGOT_PASSWORD_SMTP]", error);
        return errorResponse(
          "Password reset email is not configured. Please contact the administrator.",
          503
        );
      }

      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${appUrl}/reset-password`,
        },
        headers: request.headers,
      });

      return successResponse(
        { maskedEmail: maskEmail(email) },
        "If this email is registered, you will receive a reset link shortly."
      );
    } catch (error) {
      console.error("[FORGOT_PASSWORD]", error);
      return errorResponse(
        "Unable to send the reset email right now. Please try again later or contact the administrator.",
        503
      );
    }
  });
}
