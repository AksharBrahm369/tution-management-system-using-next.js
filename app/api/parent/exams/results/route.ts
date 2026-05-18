import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "PARENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: { students: true }
    });

    if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });

    const studentIds = parent.students.map(s => s.id);

    const results = await prisma.examResult.findMany({
      where: {
        studentId: { in: studentIds },
        status: "PUBLISHED",
        exam: { isResultPublished: true }
      },
      include: {
        exam: { select: { title: true, examDate: true, type: true, totalMarks: true } },
        student: { select: { firstName: true, lastName: true, studentCode: true } }
      },
      orderBy: { exam: { examDate: 'desc' } }
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch parent results" }, { status: 500 });
  }
}
