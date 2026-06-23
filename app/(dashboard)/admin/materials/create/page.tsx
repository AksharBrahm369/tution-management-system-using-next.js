import { prisma } from "@/lib/prisma";
import CreateMaterialPage from "@/components/admin/materials/CreateMaterial/CreateMaterialPage";
import { getCloudinaryConfig, getMissingCloudinaryVars } from "@/lib/cloudinary";
import { requireInstituteSession } from "@/lib/auth";

export default async function AdminCreateMaterialRoutePage({
  searchParams,
}: {
  searchParams?: Promise<{ standardId?: string }>;
}) {
  const params = await searchParams;
  const standardId = params?.standardId;
  const session = await requireInstituteSession();
  const instituteId = session.instituteId;

  const batches = await prisma.batch.findMany({
    where: { status: "ACTIVE", instituteId, ...(standardId ? { standardId } : {}) },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  let subjects = [];
  if (standardId) {
    subjects = await prisma.subject.findMany({
      where: {
        isActive: true,
        instituteId,
        OR: [
          { batches: { some: { standardId } } },
          { teacherStandardSubjects: { some: { standardId } } },
          { exams: { some: { standardId } } },
          { materials: { some: { standardId } } },
        ],
      },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  }

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
      standardId={standardId} 
      isCloudinaryConfigured={hasCloudinary}
      missingCloudinaryVars={missingCloudinaryVars}
    />
  );
}
