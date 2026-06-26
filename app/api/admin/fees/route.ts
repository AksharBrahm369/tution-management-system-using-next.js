import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 1);

    const [monthlyTotals, overdueTotals, paymentTotals, totalStudents, dueStudents] = await Promise.all([
      prisma.feeRecord.aggregate({
        where: { month, year },
        _sum: { totalAmount: true, pendingAmount: true },
      }),
      prisma.feeRecord.aggregate({
        where: { month, year, status: "OVERDUE" },
        _sum: { pendingAmount: true },
      }),
      prisma.feePayment.aggregate({
        where: {
          status: "COMPLETED",
          paidAt: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amount: true },
      }),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.feeRecord.count({ where: { month, year, pendingAmount: { gt: 0 } } }),
    ]);

    const totalDue = monthlyTotals._sum.totalAmount ?? 0;
    const pendingAmount = monthlyTotals._sum.pendingAmount ?? 0;
    const overdueAmount = overdueTotals._sum.pendingAmount ?? 0;
    const totalCollected = paymentTotals._sum.amount ?? 0;

    return NextResponse.json({
      month,
      year,
      totalDue: parseFloat(totalDue.toFixed(2)),
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      pendingAmount: parseFloat(pendingAmount.toFixed(2)),
      overdueAmount: parseFloat(overdueAmount.toFixed(2)),
      totalStudents,
      dueStudents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
