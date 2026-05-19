import prisma from "@/lib/prisma";
import AllResultsPage from "@/components/admin/exams/Results/AllResultsPage";

export default async function AdminExamResultsPage() {
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

  return <AllResultsPage exams={exams} />;
}
