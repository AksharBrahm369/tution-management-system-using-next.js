import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-for-dev-only-replace-in-production"
);

export interface AdminAuthContext {
  userId: string;
  role: Role;
}

export interface CurrentAdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
}

const ADMIN_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isActive: true,
} as const;

export async function requireSuperAdmin(request: NextRequest): Promise<AdminAuthContext> {
  const token = request.cookies.get("tuitionpro_auth")?.value ?? request.cookies.get("auth-token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const { payload } = await jwtVerify(token, JWT_SECRET);
  const userId = (payload.sub || payload.userId) as string;
  if (!userId) {
    throw new Error("Unauthorized: No userId in token");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    // User ID from JWT doesn't exist in DB — likely a stale token after a DB reset or user deletion
    throw new Error(`Unauthorized: Session expired. Please log in again.`);
  }

  if (user.role !== "SUPER_ADMIN") {
    throw new Error(`Forbidden: User role is ${user.role}, but expected SUPER_ADMIN`);
  }

  return { userId, role: user.role };
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tuitionpro_auth")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload.sub || payload.userId) as string | undefined;
    if (!userId) return null;

    const [session, user] = await Promise.all([
      prisma.session.findUnique({ where: { token }, select: { expiresAt: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: ADMIN_USER_SELECT }),
    ]);

    if (!session || session.expiresAt < new Date()) return null;
    if (!user?.isActive || user.role !== "SUPER_ADMIN") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}
