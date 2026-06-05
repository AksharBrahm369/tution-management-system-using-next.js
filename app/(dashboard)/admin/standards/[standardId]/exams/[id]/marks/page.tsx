import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MarksEntryPage from "@/components/admin/exams/MarksEntry/MarksEntryPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardExamMarksPage({
  params,
}: {
  params: Promise<{ standardId: string; id: string }>;
}) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) return notFound();

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

  return (
    <MarksEntryPage
      exam={{
        ...exam,
        examDate: exam.examDate.toISOString(),
        resultPublishedAt: exam.resultPublishedAt?.toISOString() ?? null,
      }}
      basePath={`/admin/standards/${standard.id}/exams`}
    />
  );
}
