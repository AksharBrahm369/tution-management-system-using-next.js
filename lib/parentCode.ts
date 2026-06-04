import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function formatParentCode(year: number, sequence: number): string {
  return `PAR-${year}-${String(sequence).padStart(3, "0")}`;
}

function extractCodeParts(code: string): { year: number; sequence: number } | null {
  const match = code.match(/^PAR-(\d{4})-(\d{3})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  };
}

export async function generateNextParentCode(): Promise<string> {
  const currentYear = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    // Different lock ID from studentCode (915273)
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(915274)`);

    const lastParent = await tx.parent.findFirst({
      where: {
        parentCode: {
          startsWith: `PAR-${currentYear}-`,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { parentCode: true },
    });

    if (!lastParent?.parentCode) {
      return formatParentCode(currentYear, 1);
    }

    const parts = extractCodeParts(lastParent.parentCode);
    if (!parts || parts.year !== currentYear) {
      return formatParentCode(currentYear, 1);
    }

    return formatParentCode(currentYear, parts.sequence + 1);
  });
}
