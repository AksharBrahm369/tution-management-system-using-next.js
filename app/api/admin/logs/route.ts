import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import {
  buildActivityLogWhere,
  getActivityLogStats,
  parseActivityLogQueryParams,
  serializeActivityLog,
} from "@/lib/activityLogQuery";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const params = parseActivityLogQueryParams(request.nextUrl.searchParams);
    const where = buildActivityLogWhere(params);
    const skip = ((params.page ?? 1) - 1) * (params.limit ?? 25);

    const [logs, total, stats] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: params.limit ?? 25,
      }),
      prisma.activityLog.count({ where }),
      getActivityLogStats(prisma),
    ]);

    return NextResponse.json({
      logs: logs.map(serializeActivityLog),
      total,
      page: params.page ?? 1,
      limit: params.limit ?? 25,
      stats,
    });
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
