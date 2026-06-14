/**
 * POST /api/auth/register
 *
 * Creates a new SUPER_ADMIN account with an isolated institute.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerApiSchema } from "@/lib/validations/auth";
import { errorResponse, successResponse } from "@/lib/utils";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { createDefaultSettings } from "@/lib/settings";
import { createInstituteForAdmin } from "@/lib/instituteProvisioning";
import { setRequestInstitute, withoutAuthScope } from "@/lib/institute";

export async function GET(_request: NextRequest) {
  return successResponse({
    exists: false,
    email: null,
  });
}

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body", 400);
    }

    const parsed = registerApiSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      return errorResponse("Validation failed", 422, errors);
    }

    const { name, email, phone, password } = parsed.data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("This email is already registered", 409);
    }

    const hashedPassword = await hashPassword(password);
    const institute = await createInstituteForAdmin(name, email);
    setRequestInstitute(institute.id);

    await prisma.instituteSettings.create({
      data: {
        ...createDefaultSettings(),
        instituteId: institute.id,
        name: institute.name,
        email,
        phone: phone || null,
      },
    });

    const user = await prisma.user.create({
      data: {
        instituteId: institute.id,
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        isActive: true,
        isVerified: true,
      },
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
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    await prisma.institute.update({
      where: { id: institute.id },
      data: { ownerId: user.id },
    });

    await logActivityFromRequest(request, {
      userId: user.id,
      action: "USER_CREATED",
      category: "USER_MANAGEMENT",
      severity: "INFO",
      description: "Admin account and institute created",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
    });

    return successResponse({ user }, "Admin account created successfully", 201);
  } catch (error) {
    console.error("[REGISTER]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
  });
}
