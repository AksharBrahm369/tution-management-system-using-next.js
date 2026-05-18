import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { sessionRescheduleSchema } from "@/lib/validations/batch";
import { checkConflicts } from "@/lib/conflictDetector";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id, sessionId } = await params;
    const body = await request.json();
    const parsed = sessionRescheduleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { newDate, newStartTime, newEndTime, newRoomId, reason } = parsed.data;

    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, batchId: id },
      include: { batch: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check conflicts on new time
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const newDay = dayNames[newDate.getDay()] as
      | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

    const conflicts = await checkConflicts({
      teacherId: session.teacherId,
      roomId: newRoomId || undefined,
      days: [newDay],
      startTime: newStartTime,
      endTime: newEndTime,
      excludeBatchId: id,
    });

    if (conflicts.hasConflict) {
      return NextResponse.json(
        { error: "Schedule conflict at new time", conflicts },
        { status: 409 }
      );
    }

    const [sh, sm] = newStartTime.split(":").map(Number);
    const [eh, em] = newEndTime.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    const updated = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: "RESCHEDULED",
        isRescheduled: true,
        originalDate: session.date,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        durationMinutes,
        roomId: newRoomId || session.roomId,
        rescheduledTo: newDate,
        rescheduleReason: reason,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
