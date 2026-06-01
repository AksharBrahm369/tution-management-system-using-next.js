import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { marksEntrySchema } from "@/lib/validations/exam";
import { calculateGradeFromConfig } from "@/lib/gradeCalculator";
import { calculateBatchRanks } from "@/lib/rankCalculator";
import { logActivityFromRequest } from "@/lib/activityLogger";

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

    const gradeConfig = typeof exam.gradeConfig === 'string'
      ? JSON.parse(exam.gradeConfig)
      : (exam.gradeConfig as any || null);

    await prisma.$transaction(
      async (tx) => {
        await Promise.all(
          validated.results.map(async (r) => {
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

            await tx.examResult.update({
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
                enteredAt: new Date(),
              },
            });
          })
        );
      },
      { timeout: 30000, maxWait: 10000 }
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

    await logActivityFromRequest(req, {
      userId: user.id,
      action: "MARKS_ENTERED",
      category: "EXAM",
      severity: "INFO",
      description: `Marks entered for ${validated.results.length} students`,
      entityType: "Exam",
      entityId: id,
      entityName: exam.title,
      metadata: { count: validated.results.length },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit marks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
