import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    let where: any = {};
    if (batchId) where.batchId = batchId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.exam = { subjectId };
    
    // Only fetch results where the exam is published
    where.exam = { ...where.exam, isResultPublished: true };

    const results = await prisma.examResult.findMany({
      where,
      include: {
        exam: { select: { title: true, examDate: true, type: true, totalMarks: true } },
        student: { select: { firstName: true, lastName: true, studentCode: true } }
      },
      orderBy: { exam: { examDate: 'desc' } }
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
