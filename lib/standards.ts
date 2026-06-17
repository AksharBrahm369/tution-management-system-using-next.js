import { prisma } from "@/lib/prisma";

export const DEFAULT_STANDARDS = [
  { name: "5th Standard", order: 5 },
  { name: "6th Standard", order: 6 },
  { name: "7th Standard", order: 7 },
  { name: "8th Standard", order: 8 },
  { name: "9th Standard", order: 9 },
  { name: "10th Standard", order: 10 },
  { name: "11th Standard", order: 11 },
  { name: "12th Standard", order: 12 },
];

export async function ensureDefaultStandards() {
  for (const standard of DEFAULT_STANDARDS) {
    const existing = await prisma.standard.findFirst({
      where: { order: standard.order },
    });
    if (!existing) {
      await prisma.standard.create({
        data: { ...standard, isActive: true },
      });
    } else if (existing.name !== standard.name) {
      await prisma.standard.update({
        where: { id: existing.id },
        data: { name: standard.name, isActive: true },
      });
    }
  }
}

export async function getActiveStandards() {
  await ensureDefaultStandards();
  return prisma.standard.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export async function getStandardById(standardId: string) {
  await ensureDefaultStandards();
  return prisma.standard.findUnique({ where: { id: standardId } });
}
