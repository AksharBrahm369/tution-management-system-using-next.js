import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import type { Announcement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ANNOUNCEMENT_CHANNELS = ["IN_APP", "WHATSAPP", "SMS", "EMAIL"] as const;

export type AnnouncementChannel = (typeof ANNOUNCEMENT_CHANNELS)[number];

export type AnnouncementContact = {
  studentId: string;
  name: string;
  phone: string | null;
  email: string | null;
  batchName?: string | null;
};

export type AnnouncementRecipientSet = {
  userIds: string[];
  contacts: AnnouncementContact[];
};

export function parseAnnouncementChannels(channels: unknown): AnnouncementChannel[] {
  const raw = Array.isArray(channels)
    ? channels
    : typeof channels === "string"
      ? channels.split(",")
      : [];

  const selected = raw
    .map((item) => String(item).trim().toUpperCase())
    .filter((item): item is AnnouncementChannel =>
      ANNOUNCEMENT_CHANNELS.includes(item as AnnouncementChannel)
    );

  return selected.length > 0 ? Array.from(new Set(selected)) : ["IN_APP"];
}

export function serializeAnnouncementChannels(channels: unknown) {
  return parseAnnouncementChannels(channels).join(",");
}

export function formatAnnouncementText(announcement: Pick<Announcement, "title" | "message">) {
  return `${announcement.title}\n\n${announcement.message}\n\n- TuitionPro`;
}

export function normalizePhoneForMessaging(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function resolveAnnouncementRecipients(
  announcement: Pick<Announcement, "audience">
): Promise<AnnouncementRecipientSet> {
  const audience = (announcement.audience || "STUDENT").toUpperCase();

  if (audience.startsWith("BATCH:")) {
    const batchId = announcement.audience.slice("BATCH:".length);
    const enrollments = await prisma.batchEnrollment.findMany({
      where: { batchId, isActive: true, student: { status: "ACTIVE" } },
      include: {
        batch: { select: { name: true } },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            userId: true,
          },
        },
      },
    });

    return {
      userIds: uniqueStrings(enrollments.map((item) => item.student.userId)),
      contacts: enrollments.map((item) => ({
        studentId: item.student.id,
        name: `${item.student.firstName} ${item.student.lastName}`.trim(),
        phone: normalizePhoneForMessaging(item.student.phone),
        email: item.student.email,
        batchName: item.batch.name,
      })),
    };
  }

  if (audience === "STUDENT" || audience === "ALL") {
    const students = await prisma.student.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        userId: true,
      },
    });

    const userIds = audience === "ALL"
      ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true } }).then((users) => users.map((user) => user.id))
      : uniqueStrings(students.map((student) => student.userId));

    return {
      userIds,
      contacts: students.map((student) => ({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`.trim(),
        phone: normalizePhoneForMessaging(student.phone),
        email: student.email,
      })),
    };
  }

  const users = await prisma.user.findMany({
    where: { role: audience as any, isActive: true },
    select: { id: true },
  });

  return { userIds: users.map((user) => user.id), contacts: [] };
}

export async function createAnnouncementNotifications(
  announcement: Pick<Announcement, "title" | "message">,
  userIds: string[]
) {
  const uniqueUserIds = uniqueStrings(userIds);
  if (uniqueUserIds.length === 0) return 0;

  const now = new Date();

  for (const userId of uniqueUserIds) {
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        userId,
        title: announcement.title,
        message: announcement.message,
        type: "ANNOUNCEMENT",
        isRead: false,
        link: "/admin/communication",
      } as any,
    });
  }

  return uniqueUserIds.length;
}

export async function deliverAnnouncementToContacts(
  announcement: Pick<Announcement, "title" | "message">,
  channels: AnnouncementChannel[],
  contacts: AnnouncementContact[]
) {
  const message = formatAnnouncementText(announcement);
  const phones = uniqueStrings(contacts.map((contact) => contact.phone));
  const emails = uniqueStrings(contacts.map((contact) => contact.email));
  const result = {
    whatsapp: 0,
    sms: 0,
    email: 0,
    skipped: [] as string[],
  };

  if (channels.includes("EMAIL") && emails.length > 0) {
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.INSTITUTE_EMAIL || process.env.SMTP_USER,
        bcc: emails,
        subject: announcement.title,
        text: message,
      });
      result.email = emails.length;
    } else {
      result.skipped.push("SMTP is not configured; email announcement was not sent.");
    }
  }

  if (channels.includes("WHATSAPP") && phones.length > 0) {
    result.whatsapp = await sendViaTwilio("WHATSAPP", phones, message, result.skipped);
  }

  if (channels.includes("SMS") && phones.length > 0) {
    result.sms = await sendViaTwilio("SMS", phones, message, result.skipped);
  }

  return result;
}

async function sendViaTwilio(
  channel: "WHATSAPP" | "SMS",
  phones: string[],
  message: string,
  skipped: string[]
) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = channel === "WHATSAPP" ? process.env.TWILIO_WHATSAPP_NUMBER : process.env.TWILIO_SMS_NUMBER;

  if (!sid || !token || !from) {
    skipped.push(`Twilio ${channel.toLowerCase()} is not configured; ${channel.toLowerCase()} announcement was not sent.`);
    console.log(`[ANNOUNCEMENT_${channel}]`, phones, message);
    return 0;
  }

  const twilioModule = await import("twilio");
  const twilio = twilioModule.default || twilioModule;
  const client = twilio(sid, token);
  const fromAddress = channel === "WHATSAPP" && !from.startsWith("whatsapp:") ? `whatsapp:${from}` : from;

  for (const phone of phones) {
    const to = channel === "WHATSAPP" ? `whatsapp:+${phone}` : `+${phone}`;
    await client.messages.create({ from: fromAddress, to, body: message });
  }

  return phones.length;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}
