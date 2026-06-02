import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { syncActiveExamStatuses } from "@/lib/examService";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncActiveExamStatuses();

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const results = await prisma.examResult.findMany({
      where: { 
        studentId: student.id,
        status: "PUBLISHED",
        exam: { isResultPublished: true }
      },
      include: {
        exam: { select: { title: true, examDate: true, type: true, totalMarks: true } }
      },
      orderBy: { exam: { examDate: 'desc' } }
    });

    const enrollments = await prisma.batchEnrollment.findMany({ where: { studentId: student.id, isActive: true } });
    const batchIds = enrollments.map(e => e.batchId);

    const upcomingExams = await prisma.exam.findMany({
      where: {
        batchId: { in: batchIds },
        status: { in: ["UPCOMING", "ONGOING"] }
      },
      include: { subject: { select: { name: true } } },
      orderBy: { examDate: 'asc' }
    });

    return NextResponse.json({ results, upcomingExams });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch student exams" }, { status: 500 });
  }
}
