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

    // total due for month
    const feeRecords = await prisma.feeRecord.findMany({ where: { month, year } });

    const totalDue = feeRecords.reduce((s, r) => s + (r.totalAmount || 0), 0);
    const pendingAmount = feeRecords.reduce((s, r) => s + (r.pendingAmount || 0), 0);
    const overdueAmount = feeRecords.filter(r => r.status === "OVERDUE").reduce((s, r) => s + (r.pendingAmount || 0), 0);

    // collected: sum of payments created this month
    const payments = await prisma.feePayment.findMany({ where: { paidAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } });
    const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

    // counts
    const totalStudents = await prisma.student.count();
    const dueStudents = feeRecords.filter(r => r.pendingAmount > 0).length;

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
