import PDFDocument from "pdfkit";
import getStream from "get-stream";
import prisma from "./prisma";

export async function generateReceiptPDF(paymentId: string) {
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: { feeRecord: { include: { student: true, batch: true } } },
  });

  if (!payment) throw new Error("Payment not found");

  const doc = new PDFDocument({ size: "A5", margin: 20 });

  doc.fontSize(18).text(process.env.INSTITUTE_NAME || "TUITIONPRO", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).text("Fee Receipt", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(10).text(`Receipt No: ${payment.paymentNumber}`);
  doc.text(`Date: ${new Date(payment.paidAt).toLocaleString()}`);
  doc.moveDown(0.5);

  const student = payment.feeRecord.student;
  doc.text(`Student: ${student.firstName} ${student.lastName}`);
  doc.text(`Student Code: ${student.studentCode}`);
  doc.text(`Batch: ${payment.feeRecord.batch.name}`);
  doc.moveDown(0.5);

  doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
  doc.moveDown(0.5);

  doc.text(`Amount Paid: ₹${payment.amount.toFixed(2)}`);
  doc.text(`Payment Mode: ${payment.paymentMode}`);
  if (payment.transactionId) doc.text(`Transaction ID: ${payment.transactionId}`);
  doc.text(`Collected By: ${payment.collectedBy}`);

  doc.moveDown(1);
  doc.fontSize(9).text("This is a computer generated receipt and does not require a signature.");

  doc.end();

  const buffer = await getStream.buffer(doc);
  return buffer;
}

export default { generateReceiptPDF };
