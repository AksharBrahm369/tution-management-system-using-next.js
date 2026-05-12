/**
 * POST /api/auth/logout
 *
 * Clears the auth cookie and deletes the session record from the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAuthCookie, verifyToken } from "@/lib/auth";
import { getClientIp } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("tuitionpro_auth")?.value;

    if (token) {
      try {
        // Decode to get userId for activity log
        const payload = await verifyToken(token);

        // Delete session from DB
        await prisma.session.deleteMany({ where: { token } });

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: payload.userId,
            action: "LOGOUT",
            details: "User logged out",
            ipAddress: getClientIp(request),
          },
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
}
