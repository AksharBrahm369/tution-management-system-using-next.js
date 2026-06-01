import type { LogCategory, LogSeverity, Prisma } from "@prisma/client";

export interface ActivityLogQueryParams {
  category?: string | null;
  severity?: string | null;
  userId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status?: string | null;
  search?: string | null;
  page?: number;
  limit?: number;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildActivityLogWhere(params: ActivityLogQueryParams): Prisma.ActivityLogWhereInput {
  const where: Prisma.ActivityLogWhereInput = {};

  if (params.category && params.category !== "ALL") {
    where.category = params.category as LogCategory;
  }

  if (params.severity && params.severity !== "ALL") {
    where.severity = params.severity as LogSeverity;
  }

  if (params.userId) {
    where.userId = params.userId;
  }

  if (params.fromDate || params.toDate) {
    where.createdAt = {};
    if (params.fromDate) {
      where.createdAt.gte = new Date(params.fromDate);
    }
    if (params.toDate) {
      const end = new Date(params.toDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (params.status === "success") {
    where.isSuccessful = true;
  } else if (params.status === "failed") {
    where.isSuccessful = false;
  }

  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { userName: { contains: search, mode: "insensitive" } },
      { entityName: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function parseActivityLogQueryParams(searchParams: URLSearchParams): ActivityLogQueryParams {
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 25)));

  return {
    category: searchParams.get("category"),
    severity: searchParams.get("severity"),
    userId: searchParams.get("userId"),
    fromDate: searchParams.get("fromDate"),
    toDate: searchParams.get("toDate"),
    status: searchParams.get("status"),
    search: searchParams.get("search"),
    page,
    limit,
  };
}

export async function getActivityLogStats(
  prisma: {
    activityLog: {
      count: (args: { where: Prisma.ActivityLogWhereInput }) => Promise<number>;
    };
  }
): Promise<{ today: number; errors: number; warnings: number; failedLogins: number }> {
  const todayStart = startOfToday();
  const todayWhere: Prisma.ActivityLogWhereInput = {
    createdAt: { gte: todayStart },
  };

  const [today, errors, warnings, failedLogins] = await Promise.all([
    prisma.activityLog.count({ where: todayWhere }),
    prisma.activityLog.count({
      where: {
        ...todayWhere,
        severity: { in: ["ERROR", "CRITICAL"] },
      },
    }),
    prisma.activityLog.count({
      where: { ...todayWhere, severity: "WARNING" },
    }),
    prisma.activityLog.count({
      where: {
        ...todayWhere,
        category: "AUTH",
        action: "LOGIN_FAILED",
        isSuccessful: false,
      },
    }),
  ]);

  return { today, errors, warnings, failedLogins };
}

export function serializeActivityLog(log: {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  category: string;
  severity: string;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  description: string;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  isSuccessful: boolean;
  errorMessage: string | null;
  createdAt: Date;
}) {
  return {
    id: log.id,
    userId: log.userId,
    userName: log.userName,
    userRole: log.userRole,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    action: log.action,
    category: log.category,
    severity: log.severity,
    entityType: log.entityType,
    entityId: log.entityId,
    entityName: log.entityName,
    description: log.description,
    oldValue: log.oldValue,
    newValue: log.newValue,
    metadata: log.metadata,
    isSuccessful: log.isSuccessful,
    errorMessage: log.errorMessage,
    createdAt: log.createdAt.toISOString(),
  };
}
