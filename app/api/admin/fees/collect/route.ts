import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { collectFeeSchema } from "@/lib/validations/fee";
import { generateReceiptPDF } from "@/lib/receiptGenerator";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const pendingRecords = await prisma.feeRecord.findMany({
      where: { pendingAmount: { gt: 0 } },
      include: {
        student: true,
        batch: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ records: pendingRecords });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    const parsed = collectFeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const feeRecords = await prisma.feeRecord.findMany({
      where: { id: { in: data.feeRecordIds }, studentId: data.studentId },
      include: { student: true, batch: true },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    if (!feeRecords.length) {
      return NextResponse.json({ error: "No matching fee records found" }, { status: 404 });
    }

    const totalPending = feeRecords.reduce((sum, record) => sum + record.pendingAmount, 0);
    const amountToCollect = Math.min(data.amount, totalPending);
    if (amountToCollect <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    const collectedAt = new Date();
    const paymentNumber = `PAY-${Date.now()}`;
    let remaining = amountToCollect;
    let firstPaymentId: string | null = null;

    const updatedRecords = [];

    for (let index = 0; index < feeRecords.length; index += 1) {
      if (remaining <= 0) break;

      const record = feeRecords[index];
      const payable = Math.min(record.pendingAmount, remaining);
      const nextPending = parseFloat((record.pendingAmount - payable).toFixed(2));
      const nextPaid = parseFloat((record.paidAmount + payable).toFixed(2));
      const nextStatus = nextPending <= 0 ? "PAID" : "PARTIAL";

      const updated = await prisma.feeRecord.update({
        where: { id: record.id },
        data: {
          paidAmount: nextPaid,
          pendingAmount: nextPending,
          status: nextStatus,
          paidDate: nextPending <= 0 ? collectedAt : record.paidDate,
        },
      });

      const payment = await prisma.feePayment.create({
        data: {
          paymentNumber: `${paymentNumber}-${index + 1}`,
          feeRecordId: record.id,
          amount: payable,
          paymentMode: data.paymentMode,
          status: "COMPLETED",
          transactionId: data.transactionDetails?.transactionId ?? null,
          gatewayName: data.transactionDetails?.gatewayName ?? null,
          gatewayResponse: data.transactionDetails ?? undefined,
          upiId: data.transactionDetails?.upiId ?? null,
          collectedBy: data.collectedBy,
          notes: data.notes,
          cashReceivedBy: data.paymentMode === "CASH" ? data.collectedBy : null,
          paidAt: collectedAt,
        },
      });

      if (!firstPaymentId) firstPaymentId = payment.id;
      updatedRecords.push(updated);
      remaining = parseFloat((remaining - payable).toFixed(2));
    }

    const receiptBytes = firstPaymentId ? (await generateReceiptPDF(firstPaymentId)).length : 0;

    return NextResponse.json(
      {
        success: true,
        collected: amountToCollect,
        paymentNumber,
        receiptBytes,
        records: updatedRecords,
        collectedBy: auth.userId,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}