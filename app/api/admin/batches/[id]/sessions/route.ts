import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { sessionCreateSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { batchId: id };

    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const startOfMonth = new Date(yearNum, monthNum - 1, 1);
      const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59);
      where.date = { gte: startOfMonth, lte: endOfMonth };
    }

    if (status) where.status = status;

    const sessions = await prisma.classSession.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        room: { select: { name: true, code: true } },
        _count: { select: { attendance: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = sessionCreateSchema.safeParse({ ...body, batchId: id });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { teacherId: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    const session = await prisma.classSession.create({
      data: {
        batchId: id,
        teacherId: batch.teacherId,
        roomId: data.roomId || null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        topic: data.topic || null,
        description: data.description || null,
        homework: data.homework || null,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
