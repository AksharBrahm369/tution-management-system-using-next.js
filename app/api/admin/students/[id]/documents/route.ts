import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { documentTypeSchema } from "@/lib/validations/student";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadBufferToCloudinary(buffer: Buffer, folder: string, filename: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const typeValue = String(formData.get("type") ?? "OTHER");
    const name = String(formData.get("name") ?? "Uploaded Document");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const parsedType = documentTypeSchema.safeParse(typeValue);
    if (!parsedType.success) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadBufferToCloudinary(buffer, `tuitionpro/students/${id}`, `${Date.now()}-${file.name}`);

    const document = await prisma.studentDocument.create({
      data: {
        studentId: id,
        name,
        type: parsedType.data,
        fileUrl: uploaded.secure_url,
        fileSize: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
      },
    });

    await prisma.studentActivity.create({
      data: {
        studentId: id,
        type: "DOCUMENT_UPLOADED",
        title: "Document uploaded",
        description: `${name} uploaded successfully.`,
      },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "DOCUMENT_UPLOADED",
      category: "STUDENT",
      severity: "INFO",
      description: `Document uploaded: ${name}`,
      entityType: "Student",
      entityId: id,
      entityName: name,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
