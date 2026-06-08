import { getCurrentSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import OnlineTestPage from "@/components/student/exams/OnlineTest/OnlineTestPage";

export const dynamic = "force-dynamic";

export default async function StudentOnlineTestRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || session.role !== "STUDENT") redirect("/auth/login");
  const student = await prisma.student.findFirst({ where: { userId: session.userId }, select: { id: true } });
  if (!student) redirect("/student/dashboard");

  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        select: {
          id: true,
          questionNumber: true,
          questionText: true,
          questionType: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
        },
        orderBy: { questionNumber: "asc" },
      },
      results: { where: { studentId: student.id }, select: { id: true } },
    },
  });

  if (!exam || exam.type !== "ONLINE_TEST") return notFound();
  if (exam.results.length === 0) return notFound();

  return (
    <OnlineTestPage
      examId={exam.id}
      title={exam.title}
      duration={exam.duration ?? 30}
      questions={exam.questions}
    />
  );
}
