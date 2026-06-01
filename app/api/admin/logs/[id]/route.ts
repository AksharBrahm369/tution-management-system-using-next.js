import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { serializeActivityLog } from "@/lib/activityLogQuery";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const log = await prisma.activityLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ log: serializeActivityLog(log) });
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
