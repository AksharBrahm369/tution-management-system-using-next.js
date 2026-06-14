import { randomUUID } from "crypto";
import nodemailer from "nodemailer";
import type { Announcement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ANNOUNCEMENT_CHANNELS = ["IN_APP", "WHATSAPP", "SMS", "EMAIL"] as const;

export type AnnouncementChannel = (typeof ANNOUNCEMENT_CHANNELS)[number];

export type AnnouncementContact = {
  recipientId: string;
  recipientType: "STUDENT" | "PARENT" | "TEACHER" | "USER";
  studentId?: string;
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

  const normalized = raw
    .map((item) => String(item).trim().toUpperCase())
    .filter(Boolean);

  if (normalized.includes("ALL")) {
    return [...ANNOUNCEMENT_CHANNELS];
  }

  const selected = normalized
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

type ParentContactFields = {
  fatherName: string | null;
  fatherPhone: string | null;
  fatherEmail: string | null;
  motherName: string | null;
  motherPhone: string | null;
  motherEmail: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  primaryContact: string;
};

function fullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function parentDisplayName(parent: ParentContactFields) {
  return (
    parent.guardianName ||
    parent.fatherName ||
    parent.motherName ||
    "Parent"
  );
}

function primaryParentPhone(parent?: ParentContactFields | null) {
  if (!parent) return null;
  const preference = parent.primaryContact?.toUpperCase();
  const ordered =
    preference === "MOTHER"
      ? [parent.motherPhone, parent.fatherPhone, parent.guardianPhone]
      : preference === "GUARDIAN"
        ? [parent.guardianPhone, parent.fatherPhone, parent.motherPhone]
        : [parent.fatherPhone, parent.motherPhone, parent.guardianPhone];

  return ordered.find(Boolean) ?? null;
}

function primaryParentEmail(parent?: ParentContactFields | null) {
  if (!parent) return null;
  const preference = parent.primaryContact?.toUpperCase();
  const ordered =
    preference === "MOTHER"
      ? [parent.motherEmail, parent.fatherEmail]
      : preference === "GUARDIAN"
        ? [parent.fatherEmail, parent.motherEmail]
        : [parent.fatherEmail, parent.motherEmail];

  return ordered.find(Boolean) ?? null;
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
            parent: {
              select: {
                id: true,
                fatherName: true,
                fatherPhone: true,
                fatherEmail: true,
                motherName: true,
                motherPhone: true,
                motherEmail: true,
                guardianName: true,
                guardianPhone: true,
                primaryContact: true,
              },
            },
          },
        },
      },
    });

    return {
      userIds: uniqueStrings(enrollments.map((item) => item.student.userId)),
      contacts: enrollments.map((item) => ({
        recipientId: item.student.id,
        recipientType: "STUDENT",
        studentId: item.student.id,
        name: fullName(item.student.firstName, item.student.lastName),
        phone: normalizePhoneForMessaging(item.student.phone ?? primaryParentPhone(item.student.parent)),
        email: item.student.email ?? primaryParentEmail(item.student.parent),
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
        parent: {
          select: {
            id: true,
            fatherName: true,
            fatherPhone: true,
            fatherEmail: true,
            motherName: true,
            motherPhone: true,
            motherEmail: true,
            guardianName: true,
            guardianPhone: true,
            primaryContact: true,
          },
        },
      },
    });

    const allUserIds = audience === "ALL"
      ? await prisma.user.findMany({ where: { isActive: true }, select: { id: true } }).then((users) => users.map((user) => user.id))
      : uniqueStrings(students.map((student) => student.userId));

    const studentContacts: AnnouncementContact[] = students.map((student) => ({
      recipientId: student.id,
      recipientType: "STUDENT",
      studentId: student.id,
      name: fullName(student.firstName, student.lastName),
      phone: normalizePhoneForMessaging(student.phone ?? primaryParentPhone(student.parent)),
      email: student.email ?? primaryParentEmail(student.parent),
    }));

    if (audience === "STUDENT") {
      return {
        userIds: allUserIds,
        contacts: studentContacts,
      };
    }

    const [parents, teachers] = await Promise.all([
      prisma.parent.findMany({
        where: { user: { isActive: true } },
        select: {
          id: true,
          fatherName: true,
          fatherPhone: true,
          fatherEmail: true,
          motherName: true,
          motherPhone: true,
          motherEmail: true,
          guardianName: true,
          guardianPhone: true,
          primaryContact: true,
        },
      }),
      prisma.teacher.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      }),
    ]);

    return {
      userIds: allUserIds,
      contacts: [
        ...studentContacts,
        ...parents.map((parent) => ({
          recipientId: parent.id,
          recipientType: "PARENT" as const,
          name: parentDisplayName(parent),
          phone: normalizePhoneForMessaging(primaryParentPhone(parent)),
          email: primaryParentEmail(parent),
        })),
        ...teachers.map((teacher) => ({
          recipientId: teacher.id,
          recipientType: "TEACHER" as const,
          name: fullName(teacher.firstName, teacher.lastName),
          phone: normalizePhoneForMessaging(teacher.phone),
          email: teacher.email,
        })),
      ],
    };
  }

  if (audience === "PARENT") {
    const parents = await prisma.parent.findMany({
      where: { user: { isActive: true } },
      select: {
        id: true,
        userId: true,
        fatherName: true,
        fatherPhone: true,
        fatherEmail: true,
        motherName: true,
        motherPhone: true,
        motherEmail: true,
        guardianName: true,
        guardianPhone: true,
        primaryContact: true,
      },
    });

    return {
      userIds: uniqueStrings(parents.map((parent) => parent.userId)),
      contacts: parents.map((parent) => ({
        recipientId: parent.id,
        recipientType: "PARENT",
        name: parentDisplayName(parent),
        phone: normalizePhoneForMessaging(primaryParentPhone(parent)),
        email: primaryParentEmail(parent),
      })),
    };
  }

  if (audience === "TEACHER") {
    const teachers = await prisma.teacher.findMany({
      where: { status: "ACTIVE", user: { isActive: true } },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    return {
      userIds: uniqueStrings(teachers.map((teacher) => teacher.userId)),
      contacts: teachers.map((teacher) => ({
        recipientId: teacher.id,
        recipientType: "TEACHER",
        name: fullName(teacher.firstName, teacher.lastName),
        phone: normalizePhoneForMessaging(teacher.phone),
        email: teacher.email,
      })),
    };
  }

  const users = await prisma.user.findMany({
    where: { role: audience as any, isActive: true },
    select: { id: true, name: true, phone: true, email: true },
  });

  return {
    userIds: users.map((user) => user.id),
    contacts: users.map((user) => ({
      recipientId: user.id,
      recipientType: "USER",
      name: user.name,
      phone: normalizePhoneForMessaging(user.phone),
      email: user.email,
    })),
  };
}

export async function createAnnouncementNotifications(
  announcement: Pick<Announcement, "title" | "message">,
  userIds: string[]
) {
  const uniqueUserIds = uniqueStrings(userIds);
  if (uniqueUserIds.length === 0) return 0;

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
  const settings = await prisma.instituteSettings.findFirst({
    select: {
      twilioAccountSid: true,
      twilioAuthToken: true,
      twilioWhatsAppNumber: true,
    },
  });
  const sid = process.env.TWILIO_ACCOUNT_SID || settings?.twilioAccountSid;
  const token = process.env.TWILIO_AUTH_TOKEN || settings?.twilioAuthToken;
  const from =
    channel === "WHATSAPP"
      ? process.env.TWILIO_WHATSAPP_NUMBER || settings?.twilioWhatsAppNumber
      : process.env.TWILIO_SMS_NUMBER;

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
