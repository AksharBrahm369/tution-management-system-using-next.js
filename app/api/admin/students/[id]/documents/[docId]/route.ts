import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

import { getCloudinaryConfig } from "@/lib/cloudinary";

export const runtime = "nodejs";

function extractPublicId(fileUrl: string): string | null {
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split("/");
  const uploadIndex = pathParts.findIndex((part) => part === "upload");
  if (uploadIndex === -1) return null;
  const publicParts = pathParts.slice(uploadIndex + 2);
  const last = publicParts.join("/");
  return last.replace(/\.[^.]+$/, "") || null;
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; docId: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id, docId } = await context.params;

    const document = await prisma.studentDocument.findFirst({ where: { id: docId, studentId: id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const publicId = extractPublicId(document.fileUrl);
    if (publicId) {
      const config = await getCloudinaryConfig();
      if (config) {
        cloudinary.config({
          cloud_name: config.cloudName,
          api_key: config.apiKey,
          api_secret: config.apiSecret,
          secure: true,
        });
        await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
      }
    }

    await prisma.studentDocument.delete({ where: { id: docId } });

    await prisma.studentActivity.create({
      data: {
        studentId: id,
        type: "DOCUMENT_DELETED",
        title: "Document removed",
        description: `${document.name} was deleted.`,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
