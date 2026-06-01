import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const todayStart = startOfToday();
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const [
      totalStudents,
      totalTeachers,
      activeBatches,
      studentsJoinedThisMonth,
      todayAttendanceRecords,
      todayPresent,
      feePaymentsThisMonth,
      pendingFeeRecords,
    ] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.teacher.count({ where: { status: "ACTIVE" } }),
      prisma.batch.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { joiningDate: { gte: monthStart } } }),
      prisma.attendance.count({
        where: { date: { gte: todayStart } },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: todayStart },
          status: { in: ["PRESENT", "LATE", "HALF_DAY"] },
        },
      }),
      prisma.feePayment.aggregate({
        where: { paidAt: { gte: monthStart }, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.feeRecord.aggregate({
        where: { pendingAmount: { gt: 0 } },
        _sum: { pendingAmount: true },
      }),
    ]);

    const todayAttendancePercent =
      todayAttendanceRecords > 0
        ? Math.round((todayPresent / todayAttendanceRecords) * 100)
        : 0;

    const stats = {
      totalStudents,
      totalTeachers,
      activeBatches,
      todayAttendance: todayAttendancePercent,
      feeCollected: feePaymentsThisMonth._sum.amount ?? 0,
      pendingFees: pendingFeeRecords._sum.pendingAmount ?? 0,
      monthlyJoinedStudents: studentsJoinedThisMonth,
      monthlyCollection: feePaymentsThisMonth._sum.amount ?? 0,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden")
      ? 403
      : message.startsWith("Unauthorized")
        ? 401
        : 500;
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
