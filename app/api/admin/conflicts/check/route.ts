import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { checkConflicts } from "@/lib/conflictDetector";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const body = await request.json();
    const { teacherId, roomId, days, startTime, endTime, excludeBatchId } = body;

    if (!days || !startTime || !endTime) {
      return NextResponse.json(
        { error: "days, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const result = await checkConflicts({
      teacherId,
      roomId,
      days,
      startTime,
      endTime,
      excludeBatchId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
