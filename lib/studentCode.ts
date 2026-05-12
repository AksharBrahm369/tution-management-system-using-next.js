import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function formatStudentCode(year: number, sequence: number): string {
  return `STU-${year}-${String(sequence).padStart(3, "0")}`;
}

function extractCodeParts(code: string): { year: number; sequence: number } | null {
  const match = code.match(/^STU-(\d{4})-(\d{3})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    sequence: Number(match[2]),
  };
}

export async function generateNextStudentCode(): Promise<string> {
  const currentYear = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(915273)`);

    const lastStudent = await tx.student.findFirst({
      orderBy: { createdAt: "desc" },
      select: { studentCode: true },
    });

    if (!lastStudent?.studentCode) {
      return formatStudentCode(currentYear, 1);
    }

    const parts = extractCodeParts(lastStudent.studentCode);
    if (!parts || parts.year !== currentYear) {
      return formatStudentCode(currentYear, 1);
    }

    return formatStudentCode(currentYear, parts.sequence + 1);
  });
}

export function studentNameToInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}
