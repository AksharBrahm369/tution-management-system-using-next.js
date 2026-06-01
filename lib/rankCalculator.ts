import prisma from "@/lib/prisma";

type RankedResult = {
  id: string;
  marksObtained: number | null;
  batchRank: number | null;
  overallRank: number | null;
};

function rankByMarks(results: RankedResult[], rankKey: "batchRank" | "overallRank") {
  let nextRank = 1;

  for (let index = 0; index < results.length; index += 1) {
    const current = results[index];
    const prev = index > 0 ? results[index - 1] : null;

    if (prev && current.marksObtained === prev.marksObtained) {
      current[rankKey] = prev[rankKey];
    } else {
      current[rankKey] = nextRank;
    }

    nextRank += 1;
  }

  return results;
}

export async function calculateBatchRanks(examId: string, batchId: string) {
  const results = await prisma.examResult.findMany({
    where: {
      examId,
      batchId,
      isAbsent: false,
      isDisqualified: false,
      status: { not: "PENDING" },
    },
    select: { id: true, marksObtained: true, batchRank: true, overallRank: true },
    orderBy: [{ marksObtained: "desc" }, { updatedAt: "asc" }],
  });

  const ranked = rankByMarks(results, "batchRank");

  await prisma.$transaction(
    ranked.map((item) =>
      prisma.examResult.update({
        where: { id: item.id },
        data: { batchRank: item.batchRank },
      })
    ),
    { timeout: 30000, maxWait: 10000 }
  );

  return ranked;
}

export async function calculateOverallRanks(examId: string) {
  const results = await prisma.examResult.findMany({
    where: {
      examId,
      isAbsent: false,
      isDisqualified: false,
      status: { not: "PENDING" },
    },
    select: { id: true, marksObtained: true, batchRank: true, overallRank: true },
    orderBy: [{ marksObtained: "desc" }, { updatedAt: "asc" }],
  });

  const ranked = rankByMarks(results, "overallRank");

  await prisma.$transaction(
    ranked.map((item) =>
      prisma.examResult.update({
        where: { id: item.id },
        data: { overallRank: item.overallRank },
      })
    ),
    { timeout: 30000, maxWait: 10000 }
  );

  return ranked;
}
