import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { Role } from "@prisma/client";
import { validateJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setRequestInstitute } from "@/lib/institute";

export interface RoleAuthContext {
  userId: string;
  instituteId: string;
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
      instituteId: true,
      role: true,
      teacher: { select: { id: true } },
      students: { select: { id: true }, take: 1 },
      parents: { select: { id: true }, take: 1 },
    },
  });

  if (!user) throw new Error("Unauthorized");
  if (!user.instituteId || user.instituteId !== payload.instituteId) {
    throw new Error("Unauthorized: Invalid institute session");
  }
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  setRequestInstitute(user.instituteId);

  return {
    userId: user.id,
    instituteId: user.instituteId,
    role: user.role,
    teacherId: user.teacher?.id,
    studentId: user.students?.[0]?.id,
    parentId: user.parents?.[0]?.id,
  };
}


export function getRouteErrorStatus(error: any) {
  // Safe check for ZodError that works across module boundaries
  if (error && typeof error === 'object' && error.name === 'ZodError') {
    const issues = error.issues || error.errors || [];
    let message = issues[0]?.message || "Validation failed";
    if (issues[0]?.code === "invalid_date" || message.includes("expected date, received Date") || message.includes("Invalid Date")) {
      message = "Please select a valid date";
    }
    return { message, status: 400 };
  }

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
