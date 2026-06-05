import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getActiveStandards } from "@/lib/standards";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const standards = await getActiveStandards();
    const now = new Date();

    const standardsWithStats = await Promise.all(
      standards.map(async (standard) => {
        const standardStudentWhere = { standardId: standard.id };

        const [totalStudents, totalTeachers, activeBatches, upcomingExams, pendingFeeAggregate] = await Promise.all([
          prisma.student.count({ where: standardStudentWhere }),
          prisma.teacher.count({
            where: {
              OR: [
                { standardSubjects: { some: { standardId: standard.id } } },
                { batches: { some: { standardId: standard.id } } },
              ],
            },
          }),
          prisma.batch.count({ where: { standardId: standard.id, status: { in: ["ACTIVE", "UPCOMING"] } } }),
          prisma.exam.count({
            where: {
              OR: [{ standardId: standard.id }, { batch: { standardId: standard.id } }],
              examDate: { gte: now },
              status: { in: ["UPCOMING", "ONGOING"] },
            },
          }),
          prisma.feeRecord.aggregate({
            where: {
              pendingAmount: { gt: 0 },
              OR: [{ student: { standardId: standard.id } }, { batch: { standardId: standard.id } }],
            },
            _sum: { pendingAmount: true },
          }),
        ]);

        return {
          ...standard,
          stats: {
            totalStudents,
            totalTeachers,
            activeBatches,
            upcomingExams,
            pendingFees: pendingFeeAggregate._sum.pendingAmount ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ standards: standardsWithStats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
