import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { questions: true }
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    if (exam.type !== "ONLINE_TEST") return NextResponse.json({ error: "Not an online test" }, { status: 400 });

    // Ensure attempt not already submitted
    const attempt = await prisma.onlineAttempt.findUnique({
      where: { examId_studentId: { examId: id, studentId: student.id } }
    });

    if (attempt && attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "Test already submitted" }, { status: 400 });
    }

    if (!attempt) {
      await prisma.onlineAttempt.create({
        data: {
          examId: id,
          studentId: student.id,
          status: "IN_PROGRESS",
          startedAt: new Date()
        }
      });
    } else if (attempt.status === "NOT_STARTED") {
      await prisma.onlineAttempt.update({
        where: { id: attempt.id },
        data: { status: "IN_PROGRESS", startedAt: new Date() }
      });
    }

    // Strip answers from questions
    const safeQuestions = exam.questions.map(q => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    }));

    // Randomize
    safeQuestions.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks
      },
      questions: safeQuestions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 });
  }
}
