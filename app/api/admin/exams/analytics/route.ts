import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    
    let where: any = { exam: { isResultPublished: true } };
    if (batchId) where.batchId = batchId;

    const results = await prisma.examResult.findMany({
      where,
      include: { exam: { select: { batchId: true, subjectId: true, type: true } } }
    });

    if (results.length === 0) return NextResponse.json({ summary: null, batches: [] });

    let totalScore = 0;
    let maxTotal = 0;
    const batchStats: Record<string, { total: number, max: number, count: number }> = {};

    for (const r of results) {
      if (r.isAbsent || r.marksObtained === null) continue;
      
      totalScore += r.marksObtained;
      maxTotal += r.totalMarks;

      const bid = r.exam.batchId;
      if (!batchStats[bid]) batchStats[bid] = { total: 0, max: 0, count: 0 };
      batchStats[bid].total += r.marksObtained;
      batchStats[bid].max += r.totalMarks;
      batchStats[bid].count++;
    }

    const overallAvg = maxTotal > 0 ? (totalScore / maxTotal) * 100 : 0;

    const batchesList = [];
    for (const bid in batchStats) {
      const b = await prisma.batch.findUnique({ where: { id: bid } });
      const avg = batchStats[bid].max > 0 ? (batchStats[bid].total / batchStats[bid].max) * 100 : 0;
      batchesList.push({
        batchId: bid,
        batchName: b?.name || bid,
        average: parseFloat(avg.toFixed(2))
      });
    }

    return NextResponse.json({
      summary: {
        overallAverage: parseFloat(overallAvg.toFixed(2)),
        totalResults: results.length
      },
      batches: batchesList.sort((a, b) => b.average - a.average)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
