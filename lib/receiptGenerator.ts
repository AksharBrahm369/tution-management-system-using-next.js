import prisma from "./prisma";

export async function generateReceiptPDF(paymentId: string) {
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: { feeRecord: { include: { student: true, batch: true } } },
  });

  if (!payment) throw new Error("Payment not found");

  const student = payment.feeRecord.student;
  const receiptText = [
    process.env.INSTITUTE_NAME || "TUITIONPRO",
    "Fee Receipt",
    `Receipt No: ${payment.paymentNumber}`,
    `Date: ${new Date(payment.paidAt).toLocaleString()}`,
    `Student: ${student.firstName} ${student.lastName}`,
    `Student Code: ${student.studentCode}`,
    `Batch: ${payment.feeRecord.batch.name}`,
    `Amount Paid: ₹${payment.amount.toFixed(2)}`,
    `Payment Mode: ${payment.paymentMode}`,
    payment.transactionId ? `Transaction ID: ${payment.transactionId}` : null,
    `Collected By: ${payment.collectedBy}`,
    "This is a computer generated receipt and does not require a signature.",
  ]
    .filter(Boolean)
    .join("\n");

  return Buffer.from(receiptText, "utf8");
}

export default { generateReceiptPDF };
