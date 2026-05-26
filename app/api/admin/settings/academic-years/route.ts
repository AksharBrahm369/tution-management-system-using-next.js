import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getOrCreateInstituteSettings } from "@/lib/settings";
import { academicYearSchema } from "@/lib/validations/settings";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const academicYears = await prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] });
    return NextResponse.json({ academicYears });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const body = await request.json();
    const parsed = academicYearSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const created = await prisma.academicYear.create({
      data: {
        name: data.name.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent ?? false,
        isActive: data.isActive ?? true,
      },
    });

    if (created.isCurrent) {
      await prisma.academicYear.updateMany({ where: { id: { not: created.id } }, data: { isCurrent: false } });
      const settings = await getOrCreateInstituteSettings();
      const academicYears = await prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] });
      await prisma.instituteSettings.update({
        where: { id: settings.id },
        data: {
          currentAcademicYear: created.name,
          academicYears: academicYears.map((year) => year.name),
        },
      });
    }

    return NextResponse.json({ academicYear: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}