import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(req);
    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id, instituteId: auth.instituteId },
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
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(req);
    const { id } = await params;

    // Verify exam belongs to this institute
    const existing = await prisma.exam.findUnique({ where: { id, instituteId: auth.instituteId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const body = await req.json();
    if (body.examDate) body.examDate = new Date(body.examDate);

    const updated = await prisma.exam.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(req);
    const { id } = await params;

    const exam = await prisma.exam.findUnique({ where: { id, instituteId: auth.instituteId } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    if (exam.isResultPublished) {
      return NextResponse.json({ error: "Cannot delete exam with published results" }, { status: 400 });
    }

    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
