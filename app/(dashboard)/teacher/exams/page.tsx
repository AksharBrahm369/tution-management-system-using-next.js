import prisma from "@/lib/prisma";
import TeacherExamsPage from "@/components/teacher/exams/TeacherExamsPage";

export default async function TeacherExamsRoutePage() {
  const exams = await prisma.exam.findMany({
    include: { batch: { select: { name: true } } },
    orderBy: { examDate: "asc" },
    take: 50,
  });

  return (
    <TeacherExamsPage
      exams={exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        examDate: exam.examDate.toISOString(),
        batchName: exam.batch.name,
        status: exam.status,
      }))}
    />
  );
}
