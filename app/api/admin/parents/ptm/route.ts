import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function buildSlots(startTime: string, endTime: string, duration: number) {
  const slots: string[] = [];
  const baseDate = new Date("2025-01-01T00:00:00Z");
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = new Date(baseDate);
  start.setUTCHours(startHour, startMinute, 0, 0);
  const end = new Date(baseDate);
  end.setUTCHours(endHour, endMinute, 0, 0);

  const current = new Date(start);
  while (current < end) {
    const next = new Date(current.getTime() + duration * 60_000);
    if (next > end) break;
    const format = (date: Date) => date.toISOString().slice(11, 16);
    slots.push(`${format(current)}-${format(next)}`);
    current.setTime(next.getTime());
  }
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const meetings = await prisma.pTMMeeting.findMany({
      orderBy: { meetingDate: "asc" },
      include: {
        slots: {
          include: {
            parent: { select: { id: true, fatherName: true, motherName: true, guardianName: true } },
            student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
            teacher: { select: { id: true, name: true } },
          },
        },
      },
    });
    return NextResponse.json({ meetings });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const {
      title,
      description,
      meetingDate,
      startTime,
      endTime,
      venue,
      isOnline = false,
      meetingLink,
      batchId,
      isForAll = true,
      slotDuration = 15,
      autoGenerateSlots = false,
    } = body;

    const meeting = await prisma.pTMMeeting.create({
      data: {
        title,
        description,
        meetingDate: new Date(meetingDate),
        startTime,
        endTime,
        venue,
        isOnline,
        meetingLink,
        batchId: batchId || null,
        isForAll,
        status: "SCHEDULED",
        createdBy: auth.userId,
      },
    });

    if (autoGenerateSlots) {
      const slotTimes = buildSlots(startTime, endTime, Number(slotDuration) || 15);
      await prisma.pTMSlot.createMany({
        data: slotTimes.map((slotTime) => ({
          meetingId: meeting.id,
          parentId: auth.parentId ?? auth.userId,
          studentId: auth.studentId ?? auth.userId,
          slotTime,
          duration: Number(slotDuration) || 15,
          status: "AVAILABLE",
        })),
      });
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
