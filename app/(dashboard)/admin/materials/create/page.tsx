import { prisma } from "@/lib/prisma";
import CreateMaterialPage from "@/components/admin/materials/CreateMaterial/CreateMaterialPage";

export default async function AdminCreateMaterialRoutePage() {
  const [batches, subjects] = await Promise.all([
    prisma.batch.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <CreateMaterialPage batches={batches} subjects={subjects} />;
}