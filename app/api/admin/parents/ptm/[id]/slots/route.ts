import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const slot = await prisma.pTMSlot.upsert({
      where: { meetingId_parentId_studentId: { meetingId: id, parentId: body.parentId, studentId: body.studentId } },
      update: {
        teacherId: body.teacherId ?? null,
        slotTime: body.slotTime,
        duration: body.duration ?? 15,
        status: body.status ?? "BOOKED",
        notes: body.notes ?? null,
        adminNotes: body.adminNotes ?? null,
      },
      create: {
        meetingId: id,
        parentId: body.parentId,
        studentId: body.studentId,
        teacherId: body.teacherId ?? null,
        slotTime: body.slotTime,
        duration: body.duration ?? 15,
        status: body.status ?? "BOOKED",
        notes: body.notes ?? null,
        adminNotes: body.adminNotes ?? null,
      },
    });
    return NextResponse.json({ slot }, { status: 200 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
