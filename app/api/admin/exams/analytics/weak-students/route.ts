import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const results = await prisma.examResult.findMany({
      where: { 
        isAbsent: false, 
        status: { not: "PENDING" },
        exam: { isResultPublished: true }
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } }
      }
    });

    const studentStats: Record<string, { total: number, max: number, student: any }> = {};

    results.forEach(r => {
      if (r.marksObtained === null) return;
      const sid = r.studentId;
      if (!studentStats[sid]) {
        studentStats[sid] = { total: 0, max: 0, student: r.student };
      }
      studentStats[sid].total += r.marksObtained;
      studentStats[sid].max += r.totalMarks;
    });

    const weakStudents = [];
    for (const sid in studentStats) {
      const stats = studentStats[sid];
      if (stats.max > 0) {
        const percent = (stats.total / stats.max) * 100;
        if (percent < 40) {
          weakStudents.push({
            ...stats.student,
            averagePercentage: parseFloat(percent.toFixed(2))
          });
        }
      }
    }

    return NextResponse.json(weakStudents.sort((a, b) => a.averagePercentage - b.averagePercentage));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch weak students" }, { status: 500 });
  }
}
