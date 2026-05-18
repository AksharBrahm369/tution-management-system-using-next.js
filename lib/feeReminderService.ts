import nodemailer from "nodemailer";
import prisma from "./prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendFeeReminderEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    console.warn("SMTP not configured, skipping email reminder to", to);
    return;
  }
  await transporter.sendMail({
    from: process.env.INSTITUTE_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export async function sendFeeReminder(feeRecordId: string, channel: string) {
  const feeRecord = await prisma.feeRecord.findUnique({ where: { id: feeRecordId }, include: { student: true } });
  if (!feeRecord) throw new Error("FeeRecord not found");

  const message = `Dear Parent, fee of ₹${feeRecord.pendingAmount} for ${feeRecord.student.firstName} is pending. Please pay at the earliest.`;

  if (channel === "EMAIL") {
    await sendFeeReminderEmail(feeRecord.student.email || "", "Fee Reminder", `<p>${message}</p>`);
  } else {
    // Placeholder for SMS/WhatsApp integrations
    console.log("Sending reminder via", channel, "to", feeRecord.student.phone, message);
  }

  await prisma.feeReminder.create({ data: { feeRecordId, studentId: feeRecord.studentId, sentTo: feeRecord.student.phone || feeRecord.student.email || "", sentVia: channel as any, message, status: "SENT", sentAt: new Date() } as any });
}

export default { sendFeeReminder, sendFeeReminderEmail };
