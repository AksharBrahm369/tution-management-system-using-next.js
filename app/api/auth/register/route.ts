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

    // ── 2. Check if SUPER_ADMIN already exists ────────────────────────────────
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    const isDefaultAdmin = existingAdmin?.email === "darshanzala369@gmail.com";

    if (existingAdmin && !isDefaultAdmin) {
      return errorResponse(
        "Super admin already exists. Contact your administrator.",
        409
      );
    }

    // ── 3. Check duplicate email ──────────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && (!existingAdmin || existingUser.id !== existingAdmin.id)) {
      return errorResponse("This email is already registered", 409);
    }

    // ── 4. Hash password ──────────────────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── 5. Create or Update user ──────────────────────────────────────────────
    let user;
    if (existingAdmin && isDefaultAdmin) {
      // Update the default seeded admin to avoid foreign key violations on referenced tables
      user = await prisma.user.update({
        where: { id: existingAdmin.id },
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
      description: "Super Admin account created",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
    });

    return successResponse({ user }, "Account created successfully", 201);
  } catch (error) {
    console.error("[REGISTER]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
