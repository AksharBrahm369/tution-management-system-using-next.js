import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

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
    const extension = path.extname(file.name) || ".png";
    const fileName = `profile-${Date.now()}${extension}`;
    const targetDir = path.join(process.cwd(), "public", "uploads", "profiles");
    const targetPath = path.join(targetDir, fileName);

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetPath, buffer);

    const imageUrl = `/uploads/profiles/${fileName}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
