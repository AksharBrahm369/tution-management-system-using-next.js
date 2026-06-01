import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { calculateFeeForStudent } from "@/lib/feeCalculator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const month = Number(body.month) || new Date().getMonth() + 1;
    const year = Number(body.year) || new Date().getFullYear();
    const batchIds: string[] | undefined = body.batchIds;

    // find enrollments
    const enrollWhere: any = { isActive: true };
    if (batchIds && batchIds.length) enrollWhere.batchId = { in: batchIds };

    const enrollments = await prisma.batchEnrollment.findMany({ where: enrollWhere, include: { student: true, batch: true } });

    let created = 0;
    for (const enrollment of enrollments) {
      if (!enrollment.batch) {
        continue;
      }

      const exists = await prisma.feeRecord.findFirst({ where: { studentId: enrollment.studentId, batchId: enrollment.batchId, month, year } });
      if (exists) continue;

      const breakdown = await calculateFeeForStudent(enrollment.studentId, enrollment.batchId, month, year);
      const feeStructure = await prisma.feeStructure.findFirst({ where: { batchId: enrollment.batchId } });

      const receiptNumber = `RCP-${year}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      await prisma.feeRecord.create({
        data: {
          receiptNumber,
          studentId: enrollment.studentId,
          batchId: enrollment.batchId,
          feeStructureId: feeStructure?.id ?? null,
          month,
          year,
          academicYear: enrollment.batch.academicYear,
          baseFee: breakdown.baseFee,
          discountAmount: breakdown.discountAmount,
          scholarshipAmount: breakdown.scholarshipAmount,
          lateFee: breakdown.lateFee,
          otherCharges: breakdown.otherCharges,
          totalAmount: breakdown.totalDue,
          paidAmount: 0,
          pendingAmount: breakdown.totalDue,
          dueDate: breakdown.dueDate,
          isGSTApplicable: breakdown.gstAmount > 0,
          gstAmount: breakdown.gstAmount,
        },
      });
      created++;
    }

    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
