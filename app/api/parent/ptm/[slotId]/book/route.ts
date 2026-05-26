import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const auth = await requireParent(request);
    const { slotId } = await params;
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } });
    if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const slot = await prisma.pTMSlot.findUnique({ where: { id: slotId } });
    if (!slot) return NextResponse.json({ error: "PTM slot not found" }, { status: 404 });

    const booked = await prisma.pTMSlot.update({
      where: { id: slotId },
      data: {
        parentId: parent.id,
        studentId: body.studentId,
        teacherId: body.teacherId ?? slot.teacherId,
        status: "BOOKED",
        notes: body.notes ?? slot.notes,
      },
    });

    return NextResponse.json({ booked }, { status: 200 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
