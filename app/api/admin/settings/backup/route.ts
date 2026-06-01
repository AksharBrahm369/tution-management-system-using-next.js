import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { backupCreateSchema } from "@/lib/validations/settings";
import { getOrCreateInstituteSettings } from "@/lib/settings";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

function formatBytes(size: number) {
  return `${(size / 1024).toFixed(1)} KB`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = backupCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const settings = await getOrCreateInstituteSettings();
    const snapshot = {
      generatedAt: new Date().toISOString(),
      settings,
      academicYears: await prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] }),
    };

    const backupDir = path.join(process.cwd(), "public", "backups");
    await mkdir(backupDir, { recursive: true });
    const fileName = `backup-${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);
    const content = JSON.stringify(snapshot, null, 2);
    await writeFile(filePath, content, "utf8");

    const record = await prisma.backupRecord.create({
      data: {
        fileName,
        fileUrl: `/backups/${fileName}`,
        fileSize: formatBytes(Buffer.byteLength(content, "utf8")),
        type: parsed.data.type,
        status: "COMPLETED",
        triggeredBy: auth.userId,
        completedAt: new Date(),
      },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "BACKUP_CREATED",
      category: "SETTINGS",
      severity: "INFO",
      description: `Manual backup created: ${fileName}`,
      entityType: "BackupRecord",
      entityId: record.id,
      entityName: fileName,
    });

    return NextResponse.json({ backup: record, fileUrl: record.fileUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}