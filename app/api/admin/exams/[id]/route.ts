import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        batch: { select: { name: true, color: true } },
        subject: { select: { name: true } },
        questions: { orderBy: { questionNumber: 'asc' } },
        _count: { select: { results: true } }
      }
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const enteredResults = await prisma.examResult.count({
      where: { examId: id, status: { in: ["ENTERED", "VERIFIED", "PUBLISHED"] } }
    });

    return NextResponse.json({
      ...exam,
      progress: { entered: enteredResults, total: exam._count.results }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (body.examDate) body.examDate = new Date(body.examDate);

    const updated = await prisma.exam.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (exam?.isResultPublished) {
      return NextResponse.json({ error: "Cannot delete exam with published results" }, { status: 400 });
    }

    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
