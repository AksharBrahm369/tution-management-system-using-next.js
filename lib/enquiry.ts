import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export function generateEnquiryNumber() {
  const stamp = new Date();
  const datePart = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}`;
  const suffix = randomUUID().slice(0, 6).toUpperCase();
  return `ENQ-${datePart}-${suffix}`;
}

export function splitPersonName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || name.trim() || "Student";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  return { firstName, lastName };
}

export function formatEnquiryName(studentName: string, studentClass?: string | null) {
  return studentClass ? `${studentName} — ${studentClass}` : studentName;
}

export function formatEnquiryPhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

export function normaliseEnquiryListStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

export async function notifySuperAdmins(title: string, message: string, link: string) {
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length === 0) {
    return 0;
  }

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type: "NEW_ENQUIRY",
      link,
      isRead: false,
    })),
  });

  return admins.length;
}

export async function sendEnquiryWhatsAppAcknowledgement(parentName: string, parentPhone: string) {
  const message = `Dear ${parentName}, thank you for your enquiry at TuitionPro. We will contact you within 24 hours.`;
  console.log(`[ENQUIRY_WHATSAPP] Sending to ${formatEnquiryPhone(parentPhone)}:\n${message}`);
  return message;
}
