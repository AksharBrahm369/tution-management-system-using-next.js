import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

function isReadOnlyFilesystemError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "EROFS";
}


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
    const standardId = request.nextUrl.searchParams.get("standardId");

    const materials = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT
        sm.id,
        sm.title,
        sm.description,
        sm."standardId",
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
      WHERE ${standardId ? Prisma.sql`(sm."standardId" = ${standardId} OR b."standardId" = ${standardId})` : Prisma.sql`TRUE`}
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
    let standardId = String(formData.get("standardId") ?? "").trim() || null;
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
      const buffer = Buffer.from(await file.arrayBuffer());
      storedFileName = file.name;
      storedFileSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const config = await getCloudinaryConfig();
      if (config) {
        try {
          const uploaded = await uploadToCloudinary(buffer, file.name, "tuitionpro/materials");
          storedFilePath = uploaded.url;
        } catch (uploadError: any) {
          console.error("Cloudinary upload error:", uploadError);
          return NextResponse.json(
            { error: `Cloudinary upload failed: ${uploadError?.message || "Upload service error"}` },
            { status: 400 }
          );
        }
      } else {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            { error: "Cloudinary credentials are not configured. Add a Resource URL or configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables." },
            { status: 400 }
          );
        }
        try {
          const uploadsDir = path.join(process.cwd(), "public", "uploads", "materials");
          await mkdir(uploadsDir, { recursive: true });

          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const uniqueName = `${Date.now()}-${safeName}`;
          const filePath = path.join(uploadsDir, uniqueName);

          await writeFile(filePath, buffer);
          storedFilePath = `/uploads/materials/${uniqueName}`;
        } catch (storageError) {
          if (isReadOnlyFilesystemError(storageError)) {
            return NextResponse.json(
              { error: "File uploads need Cloudinary storage on this live deployment. Add a Resource URL or configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." },
              { status: 400 }
            );
          }
          throw storageError;
        }
      }
    }

    const id = randomUUID();
    if (!standardId && batchId) {
      const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { standardId: true } });
      standardId = batch?.standardId ?? null;
    }

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO study_materials (
        id,
        title,
        description,
        "standardId",
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
        ${standardId},
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
        sm."standardId",
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
