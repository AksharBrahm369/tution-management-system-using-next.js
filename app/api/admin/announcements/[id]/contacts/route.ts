import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { resolveAnnouncementRecipients } from "@/lib/announcementDelivery";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get("tuitionpro_auth")?.value ?? request.cookies.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await jwtVerify(token, JWT_SECRET);

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
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
