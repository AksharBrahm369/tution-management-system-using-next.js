import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { validateJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface RoleAuthContext {
  userId: string;
  role: Role;
  teacherId?: string;
  studentId?: string;
  parentId?: string;
}

export async function requireRole(request: NextRequest, roles: Role[]): Promise<RoleAuthContext> {
  const payload = await validateJWT(request);
  if (!payload?.userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true,
      teacher: { select: { id: true } },
      student: { select: { id: true } },
      parent: { select: { id: true } },
    },
  });

  if (!user) throw new Error("Unauthorized");
  if (!roles.includes(user.role)) throw new Error("Forbidden");

  return {
    userId: user.id,
    role: user.role,
    teacherId: user.teacher?.id,
    studentId: user.student?.id,
    parentId: user.parent?.id,
  };
}

export function getRouteErrorStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";
  if (message.startsWith("Unauthorized")) return { message, status: 401 };
  if (message.startsWith("Forbidden")) return { message, status: 403 };
  return { message, status: 500 };
}

export function requireAdmin(request: NextRequest) {
  return requireRole(request, ["SUPER_ADMIN"]);
}

export function requireTeacher(request: NextRequest) {
  return requireRole(request, ["TEACHER"]);
}

export function requireStudent(request: NextRequest) {
  return requireRole(request, ["STUDENT"]);
}

export function requireParent(request: NextRequest) {
  return requireRole(request, ["PARENT"]);
}
