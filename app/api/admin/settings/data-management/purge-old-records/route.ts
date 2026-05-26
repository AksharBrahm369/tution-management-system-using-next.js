import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const days = Math.max(1, Number(body.days || 90));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.attendanceNotification.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.attendanceAlert.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.attendanceSession.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.attendance.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.activityLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.passwordResetToken.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);

    return NextResponse.json({ success: true, days });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}