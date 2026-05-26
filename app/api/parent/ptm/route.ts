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
          },
        },
      },
    });
    if (!parent) return NextResponse.json({ ptmSlots: [], ptmMeetings: [] });

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
      orderBy: { meetingDate: "desc" },
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

    const ptmSlots = await prisma.pTMSlot.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "desc" },
      include: {
        meeting: true,
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ ptmSlots, ptmMeetings });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
