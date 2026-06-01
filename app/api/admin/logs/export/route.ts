import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import {
  buildActivityLogWhere,
  parseActivityLogQueryParams,
  serializeActivityLog,
} from "@/lib/activityLogQuery";
import { buildActivityLogsPdf, buildActivityLogsWorkbook } from "@/lib/activityLogExport";
import type { ActivityLogRow } from "@/types/activityLog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const params = parseActivityLogQueryParams(request.nextUrl.searchParams);
    const format = request.nextUrl.searchParams.get("format") ?? "excel";
    const where = buildActivityLogWhere(params);

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const rows: ActivityLogRow[] = logs.map((log) => serializeActivityLog(log) as ActivityLogRow);

    if (format === "pdf") {
      const buffer = await buildActivityLogsPdf(rows);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="tuitionpro-activity-logs.pdf"',
        },
      });
    }

    const buffer = buildActivityLogsWorkbook(rows);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="tuitionpro-activity-logs.xlsx"',
      },
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
