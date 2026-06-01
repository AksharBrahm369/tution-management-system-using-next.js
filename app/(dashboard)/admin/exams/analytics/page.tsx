import prisma from "@/lib/prisma";
import ExamAnalyticsPage from "@/components/admin/exams/Analytics/ExamAnalyticsPage";

export default async function AdminExamAnalyticsRoutePage() {
  const exams = await prisma.exam.findMany({
    include: {
      batch: true,
      subject: true,
      results: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentCode: true,
              profilePhoto: true,
            },
          },
        },
      },
      questions: true,
    },
    orderBy: { examDate: "desc" },
  });

  return (
    <ExamAnalyticsPage
      exams={exams.map((exam) => ({
        ...exam,
        examDate: exam.examDate.toISOString(),
        resultPublishedAt: exam.resultPublishedAt?.toISOString() ?? null,
      }))}
    />
  );
}
