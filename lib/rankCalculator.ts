import prisma from "./prisma";

export async function calculateBatchRanks(examId: string, batchId: string) {
  const results = await prisma.examResult.findMany({
    where: { examId, batchId, isAbsent: false, status: { not: "PENDING" } },
    orderBy: { marksObtained: 'desc' }
  });

  if (results.length === 0) return;

  let currentRank = 1;
  const updates = [];

  for (let i = 0; i < results.length; i++) {
    if (i > 0 && results[i].marksObtained === results[i-1].marksObtained) {
      // Tie
      updates.push({
        id: results[i].id,
        batchRank: results[i-1].batchRank
      });
      // Store the same rank temporarily to easily reuse in next iteration
      (results[i] as any).batchRank = (results[i-1] as any).batchRank;
    } else {
      updates.push({
        id: results[i].id,
        batchRank: currentRank
      });
      (results[i] as any).batchRank = currentRank;
    }
    currentRank++;
  }

  // Transaction for batch updates
  await prisma.$transaction(
    updates.map(u => 
      prisma.examResult.update({
        where: { id: u.id },
        data: { batchRank: u.batchRank }
      })
    )
  );

  return updates;
}

export async function calculateOverallRanks(examId: string) {
  const results = await prisma.examResult.findMany({
    where: { examId, isAbsent: false, status: { not: "PENDING" } },
    orderBy: { marksObtained: 'desc' }
  });

  if (results.length === 0) return;

  let currentRank = 1;
  const updates = [];

  for (let i = 0; i < results.length; i++) {
    if (i > 0 && results[i].marksObtained === results[i-1].marksObtained) {
      updates.push({
        id: results[i].id,
        overallRank: results[i-1].overallRank
      });
      (results[i] as any).overallRank = (results[i-1] as any).overallRank;
    } else {
      updates.push({
        id: results[i].id,
        overallRank: currentRank
      });
      (results[i] as any).overallRank = currentRank;
    }
    currentRank++;
  }

  await prisma.$transaction(
    updates.map(u => 
      prisma.examResult.update({
        where: { id: u.id },
        data: { overallRank: u.overallRank }
      })
    )
  );

  return updates;
}
