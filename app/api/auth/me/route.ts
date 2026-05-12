/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 * Verifies the JWT from the HTTP-only cookie.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // ── 1. Extract token from cookie ──────────────────────────────────────────
    const token = request.cookies.get("tuitionpro_auth")?.value;

    if (!token) {
      return errorResponse("Unauthorized — no session found", 401);
    }

    // ── 2. Verify JWT ─────────────────────────────────────────────────────────
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return errorResponse("Session expired. Please login again", 401);
    }

    // ── 3. Validate session in DB (check it hasn't been invalidated) ──────────
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return errorResponse("Session expired. Please login again", 401);
    }

    // ── 4. Fetch fresh user data ───────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    if (!user.isActive) {
      return errorResponse("Your account has been deactivated", 403);
    }

    return successResponse({ user }, "User fetched successfully");
  } catch (error) {
    console.error("[ME]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
