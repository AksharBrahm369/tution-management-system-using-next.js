import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: {
        students: {
          include: {
            batchEnrollments: { where: { isActive: true }, include: { batch: { select: { id: true, name: true, code: true } } } },
            attendance: { orderBy: { createdAt: "desc" }, take: 1 },
            feeRecords: { orderBy: { createdAt: "desc" }, take: 4 },
            examResults: {
              orderBy: { createdAt: "desc" },
              take: 3,
              include: { exam: { select: { title: true, examDate: true, type: true } } },
            },
          },
        },
      },
    });

    if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });

    const childIds = parent.students.map((student) => student.id);
    const notices = await prisma.notification.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const childBatchIds = parent.students
      .flatMap((student) => student.batchEnrollments.map((enrollment) => enrollment.batchId))
      .filter((value, index, list) => list.indexOf(value) === index);

    const ptmMeetings = await prisma.pTMMeeting.findMany({
      where: {
        OR: [
          { isForAll: true },
          ...(childBatchIds.length ? [{ batchId: { in: childBatchIds } }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        slots: {
          where: { parentId: parent.id },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    const feeRecords = await prisma.feeRecord.findMany({
      where: { studentId: { in: childIds } },
      orderBy: { dueDate: "asc" },
      take: 12,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        batch: { select: { id: true, name: true, batchCode: true } },
      },
    });

    const upcomingEvents = [
      ...ptmMeetings.map((meeting) => ({ type: "PTM", title: meeting.title, date: meeting.meetingDate })),
      ...parent.students.flatMap((student) =>
        student.examResults.slice(0, 1).map((result) => ({ type: "EXAM", title: result.exam.title, date: result.exam.examDate }))
      ),
    ]
      .sort((a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime())
      .slice(0, 7);

    return NextResponse.json({
      parent,
      children: parent.students,
      notices,
      ptmMeetings,
      feeRecords,
      upcomingEvents,
      stats: {
        attendance: parent.students.length > 0 ? 0 : 0,
        unreadMessages: notices.filter((item) => !item.isRead).length,
      },
    });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
