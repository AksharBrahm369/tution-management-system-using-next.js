import type { NextRequest } from "next/server";
import type { LogCategory, LogSeverity, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/utils";

export interface LogActivityInput {
  userId?: string | null;
  userName?: string | null;
  userRole?: Role | null;
  action: string;
  category: LogCategory;
  severity?: LogSeverity;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  description: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  isSuccessful?: boolean;
  errorMessage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

async function resolveActor(
  userId: string | null | undefined,
  userName?: string | null,
  userRole?: Role | null
): Promise<{ userName: string | null; userRole: Role | null }> {
  if (userName || userRole) {
    return { userName: userName ?? null, userRole: userRole ?? null };
  }
  if (!userId) {
    return { userName: null, userRole: null };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });
  return {
    userName: user?.name ?? null,
    userRole: user?.role ?? null,
  };
}

async function notifyCriticalLog(log: {
  id: string;
  action: string;
  description: string;
  category: LogCategory;
}): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  if (!admins.length) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title: "Critical activity alert",
      message: `[${log.category}] ${log.action}: ${log.description}`,
      type: "GENERAL",
      link: `/admin/logs?highlight=${log.id}`,
    })),
  });
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") ?? "unknown";
}

export async function logActivity(input: LogActivityInput): Promise<string> {
  const actor = await resolveActor(input.userId, input.userName, input.userRole);
  const severity = input.severity ?? "INFO";

  const log = await prisma.activityLog.create({
    data: {
      userId: input.userId ?? null,
      userName: actor.userName,
      userRole: actor.userRole,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      action: input.action,
      category: input.category,
      severity,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entityName: input.entityName ?? null,
      description: input.description,
      oldValue: input.oldValue ?? undefined,
      newValue: input.newValue ?? undefined,
      metadata: input.metadata ?? undefined,
      isSuccessful: input.isSuccessful ?? true,
      errorMessage: input.errorMessage ?? null,
    },
  });

  if (severity === "CRITICAL") {
    await notifyCriticalLog({
      id: log.id,
      action: log.action,
      description: log.description,
      category: log.category,
    }).catch((err) => console.error("[activityLogger] critical notify failed", err));
  }

  return log.id;
}

export async function logActivityFromRequest(
  request: NextRequest,
  input: Omit<LogActivityInput, "ipAddress" | "userAgent">
): Promise<string> {
  return logActivity({
    ...input,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
}
