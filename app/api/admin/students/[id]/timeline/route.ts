import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await context.params;

    const student = await prisma.student.findUnique({ where: { id }, select: { id: true } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const timeline = await prisma.studentActivity.findMany({
      where: { studentId: id },
      orderBy: { createdAt: "desc" },
      include: { performedBy: { select: { id: true, name: true, email: true } } },
    });

    const enriched = [
      ...timeline,
      ...(
        await prisma.studentDocument.findMany({
          where: { studentId: id },
          orderBy: { uploadedAt: "desc" },
          select: { id: true, uploadedAt: true, name: true, type: true, fileUrl: true },
        })
      ).map((document) => ({
        id: document.id,
        studentId: id,
        type: "DOCUMENT_UPLOADED",
        title: "Document uploaded",
        description: `${document.name} was uploaded.`,
        metadata: document,
        performedById: null,
        performedBy: null,
        createdAt: document.uploadedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
