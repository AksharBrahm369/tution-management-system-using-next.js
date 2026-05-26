import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateInstituteSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const selected = await prisma.academicYear.findUnique({ where: { id } });
    if (!selected) {
      return NextResponse.json({ error: "Academic year not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isCurrent: false } }),
      prisma.academicYear.update({ where: { id }, data: { isCurrent: true, isActive: true } }),
    ]);

    const settings = await getOrCreateInstituteSettings();
    const academicYears = await prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] });
    await prisma.instituteSettings.update({
      where: { id: settings.id },
      data: {
        currentAcademicYear: selected.name,
        academicYears: academicYears.map((year) => year.name),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}