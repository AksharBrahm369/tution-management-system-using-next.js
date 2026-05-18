import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    await prisma.exam.update({
      where: { id },
      data: {
        status: "RESULT_PUBLISHED",
        isResultPublished: true,
        resultPublishedAt: new Date(),
        publishedBy: user.id
      }
    });

    await prisma.examResult.updateMany({
      where: { examId: id },
      data: { status: "PUBLISHED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to publish results" }, { status: 500 });
  }
}
