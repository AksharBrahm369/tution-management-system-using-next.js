import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/activityLogQuery";
import type { SecurityEventsResponse } from "@/types/activityLog";

export const runtime = "nodejs";

const SUSPICIOUS_THRESHOLD = 5;

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const todayStart = startOfToday();

    const authToday = {
      createdAt: { gte: todayStart },
      category: "AUTH" as const,
    };

    const [
      failedLoginsToday,
      accountLockouts,
      permissionChanges,
      settingsChanges,
      failedLoginAttempts,
      ipGroups,
    ] = await Promise.all([
      prisma.activityLog.count({
        where: { ...authToday, action: "LOGIN_FAILED", isSuccessful: false },
      }),
      prisma.activityLog.count({
        where: { ...authToday, action: "ACCOUNT_LOCKED" },
      }),
      prisma.activityLog.count({
        where: {
          createdAt: { gte: todayStart },
          category: "USER_MANAGEMENT",
          action: { contains: "PERMISSION", mode: "insensitive" },
        },
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: todayStart }, category: "SETTINGS" },
      }),
      prisma.activityLog.findMany({
        where: { ...authToday, action: "LOGIN_FAILED", isSuccessful: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.activityLog.findMany({
        where: {
          ...authToday,
          action: "LOGIN_FAILED",
          isSuccessful: false,
          ipAddress: { not: null },
        },
        select: { ipAddress: true },
      }),
    ]);

    const ipCounts = new Map<string, number>();
    for (const row of ipGroups) {
      if (!row.ipAddress) continue;
      ipCounts.set(row.ipAddress, (ipCounts.get(row.ipAddress) ?? 0) + 1);
    }
    const suspiciousIps = [...ipCounts.entries()]
      .filter(([, count]) => count >= SUSPICIOUS_THRESHOLD)
      .map(([ipAddress, count]) => ({ ipAddress, count }));

    const response: SecurityEventsResponse = {
      failedLoginsToday,
      accountLockouts,
      permissionChanges,
      settingsChanges,
      failedLoginAttempts: failedLoginAttempts.map((log) => ({
        id: log.id,
        ipAddress: log.ipAddress,
        userName: log.userName,
        description: log.description,
        createdAt: log.createdAt.toISOString(),
      })),
      suspiciousIps,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden")
      ? 403
      : message.startsWith("Unauthorized")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
