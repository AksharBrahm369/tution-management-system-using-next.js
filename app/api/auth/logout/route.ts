/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie and deletes the session record from the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookie, verifyToken } from "@/lib/auth";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { withoutAuthScope } from "@/lib/institute";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
  try {
    const token = request.cookies.get("tuitionpro_auth")?.value;

    if (token) {
      try {
        // Decode to get userId for activity log
        const payload = await verifyToken(token);

        // Delete session from DB
        await prisma.session.deleteMany({ where: { token } });

        await logActivityFromRequest(request, {
          userId: payload.userId,
          action: "USER_LOGGED_OUT",
          category: "AUTH",
          severity: "INFO",
          description: "User logged out",
        });
      } catch {
        // Token invalid — still clear the cookie
      }
    }

    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    clearAuthCookie(response);
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
