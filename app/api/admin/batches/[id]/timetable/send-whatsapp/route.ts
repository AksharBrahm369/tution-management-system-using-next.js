import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { normalizePhoneForMessaging } from "@/lib/announcementDelivery";

export const runtime = "nodejs";

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch batch details
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Fetch scheduled class sessions for this batch on the target date
    const sessions = await prisma.classSession.findMany({
      where: {
        batchId: id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: "CANCELLED" },
      },
      include: {
        room: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: "No classes scheduled for this date." },
        { status: 400 }
      );
    }

    // Fetch active enrollments for this batch, including student phone numbers
    const enrollments = await prisma.batchEnrollment.findMany({
      where: {
        batchId: id,
        isActive: true,
        student: { status: "ACTIVE" },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    const studentContacts = enrollments
      .map((e) => e.student)
      .filter((s) => s.phone);

    if (studentContacts.length === 0) {
      return NextResponse.json(
        { error: "No students with registered phone numbers are enrolled in this batch." },
        { status: 400 }
      );
    }

    // Format the daily timetable message
    const dateFormatted = targetDate.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let timetableText = `📚 *TuitionPro - Class Schedule*\n`;
    timetableText += `*Batch:* ${batch.name} (${batch.subject.name})\n`;
    timetableText += `*Date:* ${dateFormatted}\n\n`;
    timetableText += `Here is your schedule for today:\n\n`;

    sessions.forEach((s, idx) => {
      timetableText += `${idx + 1}. ⏰ *${formatTime(s.startTime)} - ${formatTime(s.endTime)}*\n`;
      if (s.topic) timetableText += `   📖 Topic: ${s.topic}\n`;
      timetableText += `   🏫 Room: ${s.room ? s.room.name : (batch.isOnline ? "Online" : "Classroom")}\n\n`;
    });

    timetableText += `Please arrive on time. Have a great learning session! 🚀`;

    // Fetch Twilio config
    const settings = await prisma.instituteSettings.findFirst();
    const sid = process.env.TWILIO_ACCOUNT_SID || settings?.twilioAccountSid;
    const token = process.env.TWILIO_AUTH_TOKEN || settings?.twilioAuthToken;
    const from = process.env.TWILIO_WHATSAPP_NUMBER || settings?.twilioWhatsAppNumber;

    const isTwilioConfigured = Boolean(sid && token && from);
    const results: Array<{ studentId: string; name: string; phone: string; status: "SENT" | "FAILED" | "MOCKED"; error?: string }> = [];

    if (isTwilioConfigured) {
      const twilioModule = await import("twilio");
      const twilio = twilioModule.default || twilioModule;
      const client = twilio(sid as string, token as string);
      const fromAddress = (from as string).startsWith("whatsapp:") ? (from as string) : `whatsapp:${from}`;

      for (const student of studentContacts) {
        const normalized = normalizePhoneForMessaging(student.phone as string);
        if (!normalized) {
          results.push({
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            phone: student.phone || "",
            status: "FAILED",
            error: "Invalid phone number format",
          });
          continue;
        }

        try {
          const to = `whatsapp:+${normalized}`;
          await client.messages.create({
            from: fromAddress as string,
            to,
            body: timetableText,
          });
          results.push({
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            phone: student.phone || "",
            status: "SENT",
          });
        } catch (err) {
          results.push({
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`.trim(),
            phone: student.phone || "",
            status: "FAILED",
            error: err instanceof Error ? err.message : "Twilio dispatch error",
          });
        }
      }
    } else {
      // Mock / Sandbox mode
      console.log(`[WHATSAPP_TIMETABLE_MOCK] Twilio not configured. Broadcast message for date ${date}:`);
      console.log(timetableText);

      for (const student of studentContacts) {
        results.push({
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          phone: student.phone || "",
          status: "MOCKED",
        });
      }
    }

    return NextResponse.json({
      success: true,
      isRealDispatch: isTwilioConfigured,
      messageText: timetableText,
      recipientCount: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in send-whatsapp route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
