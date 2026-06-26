import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { collectFeeSchema } from "@/lib/validations/fee";
import { generateReceiptPDF } from "@/lib/receiptGenerator";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const pendingRecords = await prisma.feeRecord.findMany({
      where: { pendingAmount: { gt: 0 } },
      select: {
        id: true,
        studentId: true,
        receiptNumber: true,
        month: true,
        year: true,
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true,
        status: true,
        dueDate: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentCode: true,
            phone: true,
          },
        },
        batch: {
          select: {
            name: true,
            code: true,
          },
        },
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
    const amountToCollect = Number(data.amount);
    if (amountToCollect < 0) {
      return NextResponse.json({ error: "Amount cannot be negative" }, { status: 400 });
    }
    if (data.feeRecordIds.length === 0 && amountToCollect <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero for ad-hoc records" }, { status: 400 });
    }

    const collectedAt = new Date();
    const paymentNumber = `PAY-${Date.now()}`;
    let firstPaymentId: string | null = null;
    const updatedRecords = [];

    // ── Case 1: Fee records provided — apply payment to them ──────────────────
    if (data.feeRecordIds.length > 0) {
      const feeRecords = await prisma.feeRecord.findMany({
        where: { id: { in: data.feeRecordIds }, studentId: data.studentId },
        include: { student: true, batch: true },
        orderBy: [{ year: "asc" }, { month: "asc" }],
      });

      if (!feeRecords.length) {
        return NextResponse.json({ error: "No matching fee records found" }, { status: 404 });
      }

      const totalPending = feeRecords.reduce((sum, record) => sum + record.pendingAmount, 0);
      const toCollect = Math.min(amountToCollect, totalPending);

      let remaining = toCollect;
      for (let index = 0; index < feeRecords.length; index += 1) {
        const record = feeRecords[index];
        if (remaining <= 0 && record.pendingAmount > 0) {
          continue;
        }
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

    // ── Case 2: No fee records — create an ad-hoc advance fee record ──────────
    } else {
      // Fetch student to get academicYear
      const student = await prisma.student.findUnique({
        where: { id: data.studentId },
        select: { academicYear: true, firstName: true, lastName: true },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      const now = new Date();
      const receiptNumber = `ADH-${Date.now()}`;

      // Resolve a batchId — prefer the student's active enrollment, fallback to any batch
      const batchEnrollment = await prisma.batchEnrollment.findFirst({
        where: { studentId: data.studentId, isActive: true },
        select: { batchId: true },
      });
      const anyBatch = batchEnrollment
        ? null
        : await prisma.batch.findFirst({ select: { id: true } });
      const batchId = batchEnrollment?.batchId ?? anyBatch?.id;

      if (!batchId) {
        return NextResponse.json(
          { error: "Cannot collect payment: student has no enrolled batch. Please enroll the student in a batch first." },
          { status: 400 }
        );
      }

      // Check if a fee record already exists for this student and batch for the current month and year
      const existingRecord = await prisma.feeRecord.findFirst({
        where: {
          studentId: data.studentId,
          batchId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      });

      if (existingRecord) {
        return NextResponse.json(
          {
            error: `A fee record already exists for this student for ${now.toLocaleString("en-US", {
              month: "long",
            })} ${now.getFullYear()}. Please select it from the list above or wait until next month to record a new fee.`,
          },
          { status: 400 }
        );
      }

      if (data.status === "PENDING") {
        // Create a pending ad-hoc fee record
        const adHocRecord = await prisma.feeRecord.create({
          data: {
            receiptNumber,
            studentId: data.studentId,
            batchId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            academicYear: student.academicYear,
            baseFee: amountToCollect,
            totalAmount: amountToCollect,
            paidAmount: 0,
            pendingAmount: amountToCollect,
            status: "PENDING",
            dueDate: now,
            paidDate: null,
          },
        });
        updatedRecords.push(adHocRecord);
      } else {
        // Create a self-contained fee record that is immediately marked PAID
        const adHocRecord = await prisma.feeRecord.create({
          data: {
            receiptNumber,
            studentId: data.studentId,
            batchId,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            academicYear: student.academicYear,
            baseFee: amountToCollect,
            totalAmount: amountToCollect,
            paidAmount: amountToCollect,
            pendingAmount: 0,
            status: "PAID",
            dueDate: now,
            paidDate: now,
          },
        });

        const payment = await prisma.feePayment.create({
          data: {
            paymentNumber: `${paymentNumber}-1`,
            feeRecordId: adHocRecord.id,
            amount: amountToCollect,
            paymentMode: data.paymentMode,
            status: "COMPLETED",
            collectedBy: data.collectedBy,
            notes: data.notes ?? "Ad-hoc payment",
            cashReceivedBy: data.paymentMode === "CASH" ? data.collectedBy : null,
            paidAt: collectedAt,
          },
        });

        firstPaymentId = payment.id;
        updatedRecords.push(adHocRecord);
      }
    }

    const receiptBytes = firstPaymentId ? (await generateReceiptPDF(firstPaymentId)).length : 0;

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: data.status === "PENDING" ? "FEE_RECORD_CREATED" : "FEE_COLLECTED",
      category: "FEE",
      severity: "INFO",
      description: data.status === "PENDING"
        ? `Recorded pending fee of ₹${amountToCollect} for student ${data.studentId}`
        : `Collected ₹${amountToCollect} for student ${data.studentId}`,
      entityType: data.status === "PENDING" ? "FeeRecord" : "FeePayment",
      entityId: (data.status === "PENDING" ? updatedRecords[0]?.id : firstPaymentId) ?? undefined,
      entityName: paymentNumber,
      metadata: { amount: amountToCollect, paymentMode: data.paymentMode },
    });

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
