import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { calculateGradeFromConfig } from "@/lib/gradeCalculator";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; studentId: string }> }) {
  try {
    const { id, studentId } = await params;
    const user = await verifyAuth(req);
    if (!user || !["SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const exam = await prisma.exam.findUnique({ where: { id } });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    let percent = null;
    let grade = null;
    let gradePoint = null;

    if (!body.isAbsent && body.marksObtained !== null && body.marksObtained !== undefined) {
      if (body.marksObtained > exam.totalMarks) {
        return NextResponse.json({ error: "Marks exceed total marks" }, { status: 400 });
      }
      percent = parseFloat(((body.marksObtained / exam.totalMarks) * 100).toFixed(2));
      const gradeConfig = exam.gradeConfig ? JSON.parse(exam.gradeConfig as string) : null;
      if (exam.gradingSystem === "PERCENTAGE" && gradeConfig) {
        const g = calculateGradeFromConfig(percent, gradeConfig);
        grade = g.grade;
        gradePoint = g.gradePoint;
      }
    }

    const updated = await prisma.examResult.update({
      where: { examId_studentId: { examId: id, studentId } },
      data: {
        marksObtained: body.isAbsent ? null : body.marksObtained,
        percentage: percent,
        grade,
        gradePoint,
        isAbsent: body.isAbsent,
        teacherRemarks: body.teacherRemarks,
        weakAreas: body.weakAreas,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update marks" }, { status: 500 });
  }
}
