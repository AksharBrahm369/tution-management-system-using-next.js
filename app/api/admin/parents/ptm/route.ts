import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
            teacher: { select: { id: true, firstName: true, lastName: true } },
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

    if (!meetingDate || typeof meetingDate !== "string") {
      return NextResponse.json({ error: "Please select a valid PTM date" }, { status: 400 });
    }

    const parsedMeetingDate = new Date(meetingDate);
    if (Number.isNaN(parsedMeetingDate.getTime())) {
      return NextResponse.json({ error: "Please select a valid PTM date" }, { status: 400 });
    }

    const meeting = await prisma.pTMMeeting.create({
      data: {
        title,
        description,
        meetingDate: parsedMeetingDate,
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

    const parentWhere: Prisma.ParentWhereInput = { userId: { not: null } };
    if (!isForAll && batchId) {
      parentWhere.students = {
        some: {
          batchEnrollments: {
            some: {
              batchId,
              isActive: true,
            },
          },
        },
      };
    }

    const notifiedParents = await prisma.parent.findMany({
      where: parentWhere,
      select: { userId: true },
    });

    if (notifiedParents.length > 0) {
      await prisma.notification.createMany({
        data: notifiedParents
          .filter((parent) => parent.userId)
          .map((parent) => ({
            userId: parent.userId as string,
            title: "New PTM Scheduled",
            message: `${title} is scheduled for ${parsedMeetingDate.toLocaleDateString()} at ${startTime}.`,
            type: "GENERAL",
            link: "/parent/ptm",
            isRead: false,
          })),
      });
    }

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
