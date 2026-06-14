import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveAnnouncementRecipients } from "@/lib/announcementDelivery";

import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });
    if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const recipients = await resolveAnnouncementRecipients(announcement);
    const phones = Array.from(new Set(recipients.contacts.map((contact) => contact.phone).filter(Boolean)));
    const emails = Array.from(new Set(recipients.contacts.map((contact) => contact.email).filter(Boolean)));

    return NextResponse.json({
      contacts: recipients.contacts,
      phones,
      emails,
      summary: {
        students: recipients.contacts.length,
        phones: phones.length,
        emails: emails.length,
      },
    });
  } catch (error) {
    console.error("Announcement contacts error:", error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
