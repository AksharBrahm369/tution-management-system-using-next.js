import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const examId = searchParams.get("examId");
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    let where: any = { isAbsent: false, status: { not: "PENDING" } };
    if (batchId) where.batchId = batchId;
    if (examId) where.examId = examId;

    const results = await prisma.examResult.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, profilePhoto: true, studentCode: true } },
        exam: { select: { title: true } }
      },
      orderBy: { marksObtained: 'desc' },
      take: limit
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch toppers" }, { status: 500 });
  }
}
