import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

function isReadOnlyFilesystemError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "EROFS";
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const config = await getCloudinaryConfig();
    let imageUrl = "";

    if (config) {
      const uploaded = await uploadToCloudinary(buffer, file.name, "tuitionpro/profiles");
      imageUrl = uploaded.url;
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Cloudinary credentials are not configured. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in settings or environment variables." },
          { status: 400 }
        );
      }
      try {
        const targetDir = path.join(process.cwd(), "public", "uploads", "profiles");
        const extension = path.extname(file.name) || ".png";
        const fileName = `profile-${Date.now()}${extension}`;
        const targetPath = path.join(targetDir, fileName);

        await mkdir(targetDir, { recursive: true });
        await writeFile(targetPath, buffer);

        imageUrl = `/uploads/profiles/${fileName}`;
      } catch (storageError) {
        if (isReadOnlyFilesystemError(storageError)) {
          return NextResponse.json(
            { error: "File uploads need Cloudinary storage on this live deployment. Please configure Cloudinary in settings or environment variables." },
            { status: 400 }
          );
        }
        throw storageError;
      }
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

