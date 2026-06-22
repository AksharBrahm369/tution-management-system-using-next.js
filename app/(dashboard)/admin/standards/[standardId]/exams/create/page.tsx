export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateExamPage from "@/components/admin/exams/CreateExam/CreateExamPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardCreateExamRoutePage({
  params,
}: {
  params: Promise<{ standardId: string }>;
}) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  const [batches, subjects] = await Promise.all([
    prisma.batch.findMany({
      where: { status: "ACTIVE", standardId: standard.id },
      select: { id: true, name: true, code: true, subjectId: true, enrollments: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CreateExamPage
      batches={batches}
      subjects={subjects}
      standardId={standard.id}
      basePath={`/admin/standards/${standard.id}/exams`}
    />
  );
}
