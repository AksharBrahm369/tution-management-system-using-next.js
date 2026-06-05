import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateMaterialPage from "@/components/admin/materials/CreateMaterial/CreateMaterialPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardCreateMaterialRoutePage({
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
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CreateMaterialPage
      batches={batches}
      subjects={subjects}
      standardId={standard.id}
      returnHref={`/admin/standards/${standard.id}/materials`}
    />
  );
}
