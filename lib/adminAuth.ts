import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireInstituteSession } from "@/lib/auth";

export interface AdminAuthContext {
  userId: string;
  instituteId: string;
  role: Role;
}

export interface CurrentAdminUser {
  id: string;
  instituteId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
}

const ADMIN_USER_SELECT = {
  id: true,
  instituteId: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isActive: true,
} as const;

export async function requireSuperAdmin(request: NextRequest): Promise<AdminAuthContext> {
  const session = await requireInstituteSession();

  if (session.role !== "SUPER_ADMIN") {
    throw new Error(`Forbidden: User role is ${session.role}, but expected SUPER_ADMIN`);
  }

  return { userId: session.userId, instituteId: session.instituteId, role: session.role };
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  try {
    const session = await requireInstituteSession();
    if (session.role !== "SUPER_ADMIN") return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: ADMIN_USER_SELECT,
    });

    if (!user || !user.isActive || !user.instituteId) return null;

    return {
      id: user.id,
      instituteId: user.instituteId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}
