import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MarksEntryPage from "@/components/admin/exams/MarksEntry/MarksEntryPage";

export default async function AdminExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id },
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
        orderBy: { createdAt: "asc" },
      },
      questions: true,
    },
  });

  if (!exam) return notFound();

  return <MarksEntryPage exam={exam} />;
}
