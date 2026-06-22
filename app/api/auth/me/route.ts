/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's profile.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/betterAuth";
import { errorResponse, successResponse } from "@/lib/utils";
import { setRequestInstitute } from "@/lib/institute";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    });

    if (!session?.user?.id) {
      return errorResponse("Unauthorized - no session found", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        instituteId: true,
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

    if (!user.instituteId) {
      return errorResponse("Session expired. Please login again", 401);
    }

    setRequestInstitute(user.instituteId);
    return successResponse({ user }, "User fetched successfully");
  } catch (error) {
    console.error("[ME]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
