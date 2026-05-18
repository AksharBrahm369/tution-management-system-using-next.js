import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const exams = await prisma.exam.findMany({
      where: { batch: { teacherId: teacher.id } },
      include: {
        batch: { select: { name: true, color: true } },
        subject: { select: { name: true } },
        _count: { select: { results: true } }
      },
      orderBy: { examDate: 'desc' }
    });

    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teacher exams" }, { status: 500 });
  }
}
