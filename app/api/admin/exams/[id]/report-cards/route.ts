import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { generateReportCard } from "@/lib/reportCardGenerator";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const { id } = await params;
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const reportCards = [];
    
    if (studentId) {
      // Generate for single student
      const url = await generateReportCard(studentId, exam.batchId, exam.academicYear, "Term 1", user.id);
      reportCards.push(url);
    } else {
      // Generate for all students in batch
      const enrollments = await prisma.batchEnrollment.findMany({
        where: { batchId: exam.batchId, isActive: true }
      });
      
      for (const enr of enrollments) {
        const url = await generateReportCard(enr.studentId, exam.batchId, exam.academicYear, "Term 1", user.id);
        reportCards.push(url);
      }
    }

    return NextResponse.json({ success: true, count: reportCards.length, urls: reportCards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate report cards" }, { status: 500 });
  }
}
