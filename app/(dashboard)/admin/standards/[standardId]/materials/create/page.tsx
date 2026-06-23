import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateMaterialPage from "@/components/admin/materials/CreateMaterial/CreateMaterialPage";
import { getCloudinaryConfig, getMissingCloudinaryVars } from "@/lib/cloudinary";
import { requireInstituteSession } from "@/lib/auth";

export default async function StandardCreateMaterialRoutePage({
  params,
}: {
  params: Promise<{ standardId: string }>;
}) {
  const { standardId } = await params;
  const session = await requireInstituteSession();
  const instituteId = session.instituteId;

  const standard = await prisma.standard.findFirst({
    where: { id: standardId, instituteId },
  });
  if (!standard) notFound();

  const batches = await prisma.batch.findMany({
    where: { status: "ACTIVE", instituteId, standardId: standard.id },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  let subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
      instituteId,
      OR: [
        { batches: { some: { standardId: standard.id } } },
        { teacherStandardSubjects: { some: { standardId: standard.id } } },
        { exams: { some: { standardId: standard.id } } },
        { materials: { some: { standardId: standard.id } } },
      ],
    },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  if (subjects.length === 0) {
    subjects = await prisma.subject.findMany({
      where: { isActive: true, instituteId },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  }

  const cloudinaryConfig = await getCloudinaryConfig();
  const missingCloudinaryVars = getMissingCloudinaryVars();
  const hasCloudinary = Boolean(cloudinaryConfig) && missingCloudinaryVars.length === 0;

  return (
    <CreateMaterialPage
      batches={batches}
      subjects={subjects}
      standardId={standard.id}
      returnHref={`/admin/standards/${standard.id}/materials`}
      isCloudinaryConfigured={hasCloudinary}
      missingCloudinaryVars={missingCloudinaryVars}
    />
  );
}
