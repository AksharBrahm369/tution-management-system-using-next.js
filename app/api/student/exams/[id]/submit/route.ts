import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const { id } = await params;
    const body = await req.json();
    const { answers, tabSwitches = 0 } = body;

    const attempt = await prisma.onlineAttempt.findUnique({
      where: { examId_studentId: { examId: id, studentId: student.id } }
    });

    if (!attempt || attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Invalid attempt state" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { questions: true }
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    let autoScore = 0;
    const answerRecords = [];

    for (const ans of answers) {
      const q = exam.questions.find(x => x.id === ans.questionId);
      if (!q) continue;

      let isCorrect = null;
      let marksAwarded = 0;

      if (q.questionType === "MCQ" || q.questionType === "TRUE_FALSE") {
        isCorrect = (ans.selectedOption === q.correctOption);
        if (isCorrect) {
          marksAwarded = q.marks;
        } else {
          marksAwarded = exam.hasNegativeMarking ? -q.negativeMarks : 0;
        }
        autoScore += marksAwarded;
      }

      answerRecords.push({
        questionId: q.id,
        studentId: student.id,
        attemptId: attempt.id,
        selectedOption: ans.selectedOption,
        writtenAnswer: ans.writtenAnswer,
        marksAwarded,
        isCorrect
      });
    }

    // Determine final score if all questions are auto-graded
    const isAllAutoGrable = exam.questions.every(q => ["MCQ", "TRUE_FALSE"].includes(q.questionType));
    const finalScore = isAllAutoGrable ? autoScore : null;

    await prisma.$transaction([
      prisma.studentAnswer.createMany({ data: answerRecords }),
      prisma.onlineAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          autoScore,
          finalScore,
          tabSwitchCount: tabSwitches,
          timeSpentMinutes: attempt.startedAt ? Math.round((new Date().getTime() - attempt.startedAt.getTime()) / 60000) : 0
        }
      }),
      // Create ExamResult if all auto-gradable
      ...(isAllAutoGrable ? [
        prisma.examResult.upsert({
          where: { examId_studentId: { examId: exam.id, studentId: student.id } },
          update: {
            marksObtained: autoScore > 0 ? autoScore : 0,
            status: "ENTERED"
          },
          create: {
            examId: exam.id,
            studentId: student.id,
            batchId: exam.batchId,
            totalMarks: exam.totalMarks,
            marksObtained: autoScore > 0 ? autoScore : 0,
            status: "ENTERED"
          }
        })
      ] : [])
    ]);

    return NextResponse.json({ success: true, score: finalScore });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit test" }, { status: 500 });
  }
}
