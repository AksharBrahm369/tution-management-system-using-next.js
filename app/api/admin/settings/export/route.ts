import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateInstituteSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const [settings, academicYears, backups] = await Promise.all([
      getOrCreateInstituteSettings(),
      prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] }),
      prisma.backupRecord.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      academicYears,
      backups,
      counts: {
        students: await prisma.student.count(),
        teachers: await prisma.teacher.count(),
        batches: await prisma.batch.count(),
        enquiries: await prisma.enquiry.count(),
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}