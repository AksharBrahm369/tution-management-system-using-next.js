/**
 * POST /api/auth/register
 *
 * Creates the initial SUPER_ADMIN account.
 * Only one SUPER_ADMIN is allowed; subsequent calls are rejected.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerApiSchema } from "@/lib/validations/auth";
import { errorResponse, successResponse } from "@/lib/utils";
import { logActivityFromRequest } from "@/lib/activityLogger";

export async function GET(request: NextRequest) {
  try {
    const existingSecondaryAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        NOT: {
          email: "darshanzala369@gmail.com",
        },
      },
    });

    return successResponse({
      exists: !!existingSecondaryAdmin,
      email: existingSecondaryAdmin?.email,
    });
  } catch (error) {
    console.error("[REGISTER_STATUS]", error);
    return errorResponse("Failed to check registration status", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse & validate request body ──────────────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = registerApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >;
      return errorResponse("Validation failed", 422, errors);
    }

    const { name, email, phone, password } = parsed.data;

    // Prevent modifying or registering as the permanent Super Admin
    if (email === "darshanzala369@gmail.com") {
      return errorResponse(
        "This email is reserved for the primary Super Admin and cannot be modified.",
        403
      );
    }

    // ── 2. Check if a secondary admin (SUPER_ADMIN other than the main darshanzala369@gmail.com) already exists ────────────────────────────────
    const existingSecondaryAdmin = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        NOT: {
          email: "darshanzala369@gmail.com",
        },
      },
    });

    // ── 3. Check duplicate email (other than the secondary admin we are about to overwrite)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && (!existingSecondaryAdmin || existingUser.id !== existingSecondaryAdmin.id)) {
      return errorResponse("This email is already registered", 409);
    }

    // ── 4. Hash password ──────────────────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── 5. Create or Update user ──────────────────────────────────────────────
    let user;
    if (existingSecondaryAdmin) {
      // Overwrite/update the existing secondary admin account to maintain referential integrity
      user = await prisma.user.update({
        where: { id: existingSecondaryAdmin.id },
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          isActive: true,
          isVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          isActive: true,
          isVerified: true, // SUPER_ADMIN is auto-verified
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
        },
      });
    }

    // ── 6. Log activity ────────────────────────────────────────────────────────
    await logActivityFromRequest(request, {
      userId: user.id,
      action: "USER_CREATED",
      category: "USER_MANAGEMENT",
      severity: "INFO",
      description: existingSecondaryAdmin
        ? "Admin account credentials updated/changed"
        : "Initial Admin account created",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
    });

    return successResponse(
      { user },
      existingSecondaryAdmin
        ? "Admin credentials changed successfully"
        : "Admin account created successfully",
      201
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
