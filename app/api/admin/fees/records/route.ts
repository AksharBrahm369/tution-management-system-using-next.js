import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const batchId = searchParams.get("batchId");
    const month = Number(searchParams.get("month")) || undefined;
    const year = Number(searchParams.get("year")) || undefined;
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

    const where: Prisma.FeeRecordWhereInput = {};
    if (status) where.status = status as Prisma.EnumFeeStatusFilter["equals"];
    if (studentId) where.studentId = studentId;
    if (batchId) where.batchId = batchId;
    if (month) where.month = month;
    if (year) where.year = year;

    const [records, totals] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentCode: true,
              phone: true,
              status: true,
              standard: { select: { id: true, name: true } },
            },
          },
          batch: { select: { id: true, name: true, code: true } },
          payments: {
            orderBy: { paidAt: "desc" },
            take: 1,
            select: { amount: true, paymentMode: true, paidAt: true },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.feeRecord.aggregate({
        where,
        _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      records,
      totals: {
        count: totals._count._all,
        totalAmount: totals._sum.totalAmount ?? 0,
        paidAmount: totals._sum.paidAmount ?? 0,
        pendingAmount: totals._sum.pendingAmount ?? 0,
      },
    });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
