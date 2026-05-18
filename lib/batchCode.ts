import { prisma } from "@/lib/prisma";

export async function generateBatchCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BCH-${year}-`;

  const lastBatch = await prisma.batch.findFirst({
    where: {
      code: { startsWith: prefix },
    },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastBatch) {
    return `${prefix}001`;
  }

  const lastSequence = parseInt(lastBatch.code.split("-").pop() || "0", 10);
  const nextSequence = String(lastSequence + 1).padStart(3, "0");
  return `${prefix}${nextSequence}`;
}
