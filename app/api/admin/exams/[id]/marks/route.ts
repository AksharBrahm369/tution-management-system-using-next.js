import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { marksEntrySchema } from "@/lib/validations/exam";
import { calculateGradeFromConfig } from "@/lib/gradeCalculator";
import { calculateBatchRanks } from "@/lib/rankCalculator";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || !["SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true, profilePhoto: true } }
      },
      orderBy: { student: { firstName: 'asc' } }
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || !["SUPER_ADMIN", "TEACHER"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = marksEntrySchema.parse(body);

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const gradeConfig = exam.gradeConfig ? JSON.parse(exam.gradeConfig as string) : null;

    await prisma.$transaction(
      validated.results.map(r => {
        let percent = null;
        let grade = null;
        let gradePoint = null;

        if (!r.isAbsent && r.marksObtained !== null) {
          if (r.marksObtained > exam.totalMarks) {
            throw new Error(`Marks cannot exceed total marks for student ${r.studentId}`);
          }
          percent = parseFloat(((r.marksObtained / exam.totalMarks) * 100).toFixed(2));
          if (exam.gradingSystem === "PERCENTAGE" && gradeConfig) {
            const g = calculateGradeFromConfig(percent, gradeConfig);
            grade = g.grade;
            gradePoint = g.gradePoint;
          }
        }

        return prisma.examResult.update({
          where: { examId_studentId: { examId: id, studentId: r.studentId } },
          data: {
            marksObtained: r.isAbsent ? null : r.marksObtained,
            percentage: percent,
            grade,
            gradePoint,
            isAbsent: r.isAbsent,
            teacherRemarks: r.teacherRemarks,
            weakAreas: r.weakAreas || [],
            status: "ENTERED",
            enteredBy: user.id,
            enteredAt: new Date()
          }
        });
      })
    );

    if (validated.calculateRanks) {
      await calculateBatchRanks(id, exam.batchId);
    }

    if (validated.publishNow) {
      await prisma.exam.update({
        where: { id },
        data: {
          status: "RESULT_PUBLISHED",
          isResultPublished: true,
          resultPublishedAt: new Date(),
          publishedBy: user.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit marks" }, { status: 500 });
  }
}
