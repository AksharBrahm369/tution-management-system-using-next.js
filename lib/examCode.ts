import prisma from "@/lib/prisma";

export function generateExamCode(year: number, sequence: number): string {
  return `EXM-${year}-${String(sequence).padStart(3, "0")}`;
}

export async function generateNextExamCode(year = new Date().getFullYear()): Promise<string> {
  const prefix = `EXM-${year}-`;
  const lastExam = await prisma.exam.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  if (!lastExam) {
    return generateExamCode(year, 1);
  }

  const parts = lastExam.code.split("-");
  const lastSequence = Number(parts[2] ?? "0");
  return generateExamCode(year, lastSequence + 1);
}
