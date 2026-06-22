/**
 * POST /api/auth/reset-password
 *
 * Resets a password through Better Auth and revokes existing sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/betterAuth";
import { resetPasswordApiSchema } from "@/lib/validations/auth";
import { errorResponse } from "@/lib/utils";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { withoutAuthScope } from "@/lib/institute";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
    try {
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

      await auth.api.resetPassword({
        body: {
          token,
          newPassword: password,
        },
        headers: request.headers,
      });

      await logActivityFromRequest(request, {
        action: "PASSWORD_CHANGED",
        category: "AUTH",
        severity: "INFO",
        description: "Password reset completed successfully",
      }).catch(() => undefined);

      const response = NextResponse.json(
        {
          success: true,
          message:
            "Password reset successfully. Please login with your new password.",
          data: null,
        },
        { status: 200 }
      );

      response.cookies.delete("tuitionpro_auth");
      return response;
    } catch (error) {
      console.error("[RESET_PASSWORD]", error);
      return errorResponse("This reset link is invalid or expired", 400);
    }
  });
}
