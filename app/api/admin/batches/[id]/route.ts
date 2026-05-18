import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { batchUpdateSchema } from "@/lib/validations/batch";
import { checkConflicts } from "@/lib/conflictDetector";
import { regenerateFutureSessions } from "@/lib/sessionGenerator";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profilePhoto: true,
            teacherCode: true,
          },
        },
        room: true,
        enrollments: {
          where: { isActive: true },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentCode: true,
                profilePhoto: true,
                phone: true,
              },
            },
          },
          orderBy: { enrollDate: "asc" },
        },
        timetableSlots: { where: { isActive: true } },
        _count: {
          select: {
            sessions: true,
            enrollments: { where: { isActive: true } },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const [completedSessions, cancelledSessions] = await Promise.all([
      prisma.classSession.count({ where: { batchId: id, status: "COMPLETED" } }),
      prisma.classSession.count({ where: { batchId: id, status: "CANCELLED" } }),
    ]);

    return NextResponse.json({
      batch: {
        ...batch,
        currentStrength: batch._count.enrollments,
        completedSessions,
        cancelledSessions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = batchUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Only check conflicts if schedule-related fields changed
    const scheduleChanged = data.scheduleChanged || false;
    if (scheduleChanged && data.teacherId && data.days && data.startTime && data.endTime) {
      const conflicts = await checkConflicts({
        teacherId: data.teacherId,
        roomId: data.roomId || undefined,
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
        excludeBatchId: id,
      });

      if (conflicts.hasConflict) {
        return NextResponse.json(
          { error: "Schedule conflict detected", conflicts },
          { status: 409 }
        );
      }
    }

    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        roomId: data.roomId === "" ? null : data.roomId,
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        maxStrength: data.maxStrength,
        academicYear: data.academicYear,
        startDate: data.startDate,
        endDate: data.endDate,
        fees: data.fees,
        isOnline: data.isOnline,
        meetingLink: data.meetingLink || null,
      },
    });

    // Update timetable slots if schedule changed
    if (scheduleChanged && data.days && data.startTime && data.endTime) {
      await prisma.timetableSlot.deleteMany({ where: { batchId: id } });
      await prisma.timetableSlot.createMany({
        data: data.days.map((day) => ({
          batchId: id,
          day,
          startTime: data.startTime!,
          endTime: data.endTime!,
          roomId: data.roomId || null,
        })),
      });

      // Regenerate future sessions
      if (data.generateSessions && data.teacherId && data.days && data.startTime && data.endTime) {
        await regenerateFutureSessions(id, {
          batchId: id,
          teacherId: data.teacherId,
          roomId: data.roomId || null,
          startDate: data.startDate ?? existing.startDate,
          endDate: data.endDate ?? existing.endDate ?? new Date(new Date().setMonth(new Date().getMonth() + 6)),
          days: data.days,
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }
    }

    return NextResponse.json({ batch: updatedBatch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Soft delete - set status to CANCELLED
    await prisma.batch.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Cancel future sessions
    await prisma.classSession.updateMany({
      where: {
        batchId: id,
        date: { gte: new Date() },
        status: "SCHEDULED",
      },
      data: { status: "CANCELLED", cancelReason: "Batch cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
