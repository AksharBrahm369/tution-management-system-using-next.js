import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import StudentExamsPage from "@/components/student/exams/StudentExamsPage";
import { syncActiveExamStatuses } from "@/lib/examService";

export default async function StudentExamsRoutePage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const student = await prisma.student.findFirst({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!student) redirect("/student/dashboard");

  await syncActiveExamStatuses();

  const [upcomingExams, results] = await Promise.all([
    prisma.exam.findMany({
      where: {
        status: { in: ["UPCOMING", "ONGOING"] },
        results: { some: { studentId: student.id } },
      },
      include: { subject: { select: { name: true } } },
      orderBy: { examDate: "asc" },
      take: 10,
    }),
    prisma.examResult.findMany({
      where: {
        studentId: student.id,
        exam: { isResultPublished: true },
      },
      include: {
        exam: { select: { id: true, title: true, examDate: true } },
      },
      orderBy: { exam: { examDate: "asc" } },
    }),
  ]);

  const allWeakAreas = results.flatMap((item) => item.weakAreas);
  const allStrongAreas = results.flatMap((item) => item.strengthAreas);

  return (
    <StudentExamsPage
      upcoming={upcomingExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate.toISOString(),
        subject: exam.subject.name,
        totalMarks: exam.totalMarks,
      }))}
      results={results.map((item) => ({
        examId: item.exam.id,
        title: item.exam.title,
        date: item.exam.examDate.toISOString(),
        marksObtained: item.marksObtained,
        totalMarks: item.totalMarks,
        percentage: item.percentage,
        grade: item.grade,
        rank: item.batchRank,
      }))}
      strongAreas={Array.from(new Set(allStrongAreas)).slice(0, 8)}
      weakAreas={Array.from(new Set(allWeakAreas)).slice(0, 8)}
    />
  );
}
