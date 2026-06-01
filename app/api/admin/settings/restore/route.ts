import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { restoreSchema } from "@/lib/validations/settings";
import { getOrCreateInstituteSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    let payload: unknown = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Backup file is required" }, { status: 400 });
      }
      payload = JSON.parse(await file.text());
    } else {
      payload = await request.json();
    }

    const parsed = restoreSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await getOrCreateInstituteSettings();

    await prisma.$transaction(async (tx) => {
      if (parsed.data.settings) {
        const workingHours = parsed.data.settings.workingHours
          ? (parsed.data.settings.workingHours as Prisma.InputJsonValue)
          : Prisma.DbNull;

        await tx.instituteSettings.update({
          where: { id: settings.id },
          data: {
            ...parsed.data.settings,
            workingHours,
          },
        });
      }

      if (parsed.data.academicYears) {
        await tx.academicYear.deleteMany();
        await tx.academicYear.createMany({
          data: parsed.data.academicYears.map((year) => ({
            name: year.name,
            startDate: year.startDate,
            endDate: year.endDate,
            isCurrent: year.isCurrent ?? false,
            isActive: year.isActive ?? true,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}