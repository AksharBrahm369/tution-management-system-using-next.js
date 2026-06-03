import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);

    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Invalid amount. Must be a non-negative number." }, { status: 400 });
    }

    const record = await prisma.feeRecord.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    if (record.status === "WAIVED") {
      return NextResponse.json({ error: "Cannot change the amount of a waived fee record." }, { status: 400 });
    }

    const newPendingAmount = parseFloat((amount - record.paidAmount).toFixed(2));
    if (newPendingAmount < 0) {
      return NextResponse.json(
        { error: `New amount cannot be less than the already paid amount (₹${record.paidAmount})` },
        { status: 400 }
      );
    }

    let nextStatus = record.status;
    if (newPendingAmount <= 0) {
      nextStatus = "PAID";
    } else if (record.paidAmount > 0) {
      nextStatus = "PARTIAL";
    } else {
      nextStatus = "PENDING";
    }

    const updated = await prisma.feeRecord.update({
      where: { id },
      data: {
        baseFee: amount,
        totalAmount: amount,
        pendingAmount: newPendingAmount,
        status: nextStatus,
        paidDate: newPendingAmount <= 0 ? new Date() : record.paidDate,
      },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "FEE_RECORD_UPDATED",
      category: "FEE",
      severity: "INFO",
      description: `Updated fee record ${record.receiptNumber} amount from ₹${record.totalAmount} to ₹${amount}`,
      entityType: "FeeRecord",
      entityId: id,
      entityName: record.receiptNumber,
      metadata: { oldAmount: record.totalAmount, newAmount: amount },
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
