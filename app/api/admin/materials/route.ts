import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

function normalizeAccessLevel(value: string | null) {
  switch (value) {
    case "BATCH_ONLY":
      return "BATCH_ONLY";
    case "PRIVATE":
      return "PRIVATE";
    default:
      return "PUBLIC";
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const materials = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        sm.id,
        sm.title,
        sm.description,
        sm."subjectId",
        sm."batchId",
        sm."resourceType",
        sm."accessLevel",
        sm."resourceUrl",
        sm."fileName",
        sm."fileSize",
        sm."createdBy",
        sm."createdAt",
        sm."updatedAt",
        COALESCE(s.name, 'General') AS "subject",
        COALESCE(b.name, 'All Batches') AS "batch"
      FROM study_materials sm
      LEFT JOIN subjects s ON s.id = sm."subjectId"
      LEFT JOIN batches b ON b.id = sm."batchId"
      ORDER BY sm."createdAt" DESC
    `);

    return NextResponse.json({
      materials: materials.map((material) => ({
        ...material,
        subject: material.subject,
        batch: material.batch,
        type: material.resourceType,
        access: material.accessLevel,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const formData = await request.formData();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const subjectId = String(formData.get("subjectId") ?? "").trim() || null;
    const batchId = String(formData.get("batchId") ?? "").trim() || null;
    const resourceType = String(formData.get("resourceType") ?? "").trim();
    const accessLevel = normalizeAccessLevel(String(formData.get("accessLevel") ?? null));
    const resourceUrl = String(formData.get("resourceUrl") ?? "").trim() || null;
    const file = formData.get("file");

    if (!title || !resourceType) {
      return NextResponse.json({ error: "Title and resource type are required" }, { status: 400 });
    }

    let storedFileName: string | null = null;
    let storedFilePath: string | null = resourceUrl;
    let storedFileSize: string | null = null;

    if (file instanceof File && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
      await mkdir(uploadsDir, { recursive: true });

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${Date.now()}-${safeName}`;
      const filePath = path.join(uploadsDir, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, buffer);

      storedFileName = file.name;
      storedFilePath = `/uploads/materials/${uniqueName}`;
      storedFileSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
    }

    const id = randomUUID();

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO study_materials (
        id,
        title,
        description,
        "subjectId",
        "batchId",
        "resourceType",
        "accessLevel",
        "resourceUrl",
        "fileName",
        "fileSize",
        "createdBy",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${title},
        ${description},
        ${subjectId},
        ${batchId},
        ${resourceType},
        ${accessLevel},
        ${storedFilePath},
        ${storedFileName},
        ${storedFileSize},
        ${auth.userId},
        NOW(),
        NOW()
      )
    `);

    const [material] = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        sm.id,
        sm.title,
        sm.description,
        sm."subjectId",
        sm."batchId",
        sm."resourceType",
        sm."accessLevel",
        sm."resourceUrl",
        sm."fileName",
        sm."fileSize",
        sm."createdBy",
        sm."createdAt",
        sm."updatedAt",
        COALESCE(s.name, 'General') AS "subject",
        COALESCE(b.name, 'All Batches') AS "batch"
      FROM study_materials sm
      LEFT JOIN subjects s ON s.id = sm."subjectId"
      LEFT JOIN batches b ON b.id = sm."batchId"
      WHERE sm.id = ${id}
      LIMIT 1
    `);

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        subject: material?.subject ?? "General",
        batch: material?.batch ?? "All Batches",
        type: material?.resourceType,
        access: material?.accessLevel,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}