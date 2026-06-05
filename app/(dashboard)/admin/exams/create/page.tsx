import prisma from "@/lib/prisma";
import CreateExamPage from "@/components/admin/exams/CreateExam/CreateExamPage";

export default async function CreateExamRoutePage({
  searchParams,
}: {
  searchParams?: Promise<{ standardId?: string }>;
}) {
  const params = await searchParams;
  const standardId = params?.standardId;
  const [batches, subjects] = await Promise.all([
    prisma.batch.findMany({
      where: { status: "ACTIVE", ...(standardId ? { standardId } : {}) },
      select: {
        id: true,
        name: true,
        code: true,
        subjectId: true,
        standardId: true,
        enrollments: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CreateExamPage batches={batches} subjects={subjects} standardId={standardId} />;
}
