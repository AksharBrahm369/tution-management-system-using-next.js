/**
 * POST /api/auth/logout
 *
 * Clears Better Auth cookies and revokes the active session.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/betterAuth";
import { appendAuthCookies, signOutWithBetterAuth } from "@/lib/betterAuthRoute";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { withoutAuthScope } from "@/lib/institute";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
        query: { disableCookieCache: true },
      });
      const signOutResult = await signOutWithBetterAuth(request);

      if (session?.user?.id) {
        await logActivityFromRequest(request, {
          userId: session.user.id,
          action: "USER_LOGGED_OUT",
          category: "AUTH",
          severity: "INFO",
          description: "User logged out",
        }).catch(() => undefined);
      }

      const response = NextResponse.json(
        { success: true, message: "Logged out successfully" },
        { status: 200 }
      );

      appendAuthCookies(response, signOutResult.headers);
      return response;
    } catch (error) {
      console.error("[LOGOUT]", error);
      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again" },
        { status: 500 }
      );
    }
  });
}
