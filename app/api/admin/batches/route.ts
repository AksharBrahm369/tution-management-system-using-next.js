import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { batchCreateSchema } from "@/lib/validations/batch";
import { generateBatchCode } from "@/lib/batchCode";
import { generateSessions } from "@/lib/sessionGenerator";
import { checkConflicts } from "@/lib/conflictDetector";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const timeRange = searchParams.get("timeRange");
    const daysParam = searchParams.get("days");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { subject: { name: { contains: search, mode: "insensitive" } } },
        {
          teacher: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (status) where.status = status;
    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;

    if (daysParam) {
      const days = daysParam.split(",").filter(Boolean);
      if (days.length > 0) {
        where.days = { hasSome: days };
      }
    }

    if (timeRange) {
      if (timeRange === "morning") {
        where.startTime = { gte: "06:00", lt: "12:00" };
      } else if (timeRange === "afternoon") {
        where.startTime = { gte: "12:00", lt: "17:00" };
      } else if (timeRange === "evening") {
        where.startTime = { gte: "17:00", lt: "21:00" };
      }
    }

    const orderBy: Record<string, string> = {};
    if (["name", "code", "startTime", "createdAt", "status"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [batches, total, totalCount, activeCount, upcomingCount, completedCount, totalEnrolled] =
      await Promise.all([
        prisma.batch.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            subject: true,
            teacher: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
            room: { select: { id: true, name: true, code: true } },
            enrollments: { where: { isActive: true }, select: { id: true } },
            _count: { select: { sessions: true } },
          },
        }),
        prisma.batch.count({ where }),
        prisma.batch.count(),
        prisma.batch.count({ where: { status: "ACTIVE" } }),
        prisma.batch.count({ where: { status: "UPCOMING" } }),
        prisma.batch.count({ where: { status: "COMPLETED" } }),
        prisma.batchEnrollment.count({ where: { isActive: true } }),
      ]);

    const batchesWithStrength = batches.map((b) => ({
      ...b,
      currentStrength: b.enrollments.length,
    }));

    return NextResponse.json({
      batches: batchesWithStrength,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: totalCount,
        active: activeCount,
        upcoming: upcomingCount,
        completed: completedCount,
        totalEnrolled,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json();
    const parsed = batchCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check conflicts
    const conflicts = await checkConflicts({
      teacherId: data.teacherId,
      roomId: data.roomId || undefined,
      days: data.days,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    if (conflicts.hasConflict) {
      return NextResponse.json(
        { error: "Schedule conflict detected", conflicts },
        { status: 409 }
      );
    }

    const code = data.code || (await generateBatchCode());
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    // Check for duplicate code
    const existing = await prisma.batch.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Batch code already exists" }, { status: 409 });
    }

    const batch = await prisma.batch.create({
      data: {
        name: data.name,
        code,
        description: data.description || null,
        color: data.color || null,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        roomId: data.roomId || null,
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes,
        maxStrength: data.maxStrength,
        currentStrength: 0,
        academicYear: data.academicYear,
        startDate: data.startDate,
        endDate: data.endDate || null,
        fees: data.fees,
        status: "ACTIVE",
        isOnline: data.isOnline,
        meetingLink: data.meetingLink || null,
        timetableSlots: {
          create: data.days.map((day) => ({
            day,
            startTime: data.startTime,
            endTime: data.endTime,
            roomId: data.roomId || null,
          })),
        },
      },
      include: {
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true } },
        room: true,
      },
    });

    // Enroll students
    let enrolledCount = 0;
    if (!data.skipEnrollment && data.studentIds && data.studentIds.length > 0) {
      const enrollments = data.studentIds.map((studentId) => ({
        studentId,
        batchId: batch.id,
        enrolledBy: auth.userId,
        isActive: true,
      }));
      await prisma.batchEnrollment.createMany({ data: enrollments, skipDuplicates: true });
      enrolledCount = data.studentIds.length;

      await prisma.batch.update({
        where: { id: batch.id },
        data: { currentStrength: enrolledCount },
      });
    }

    // Generate sessions
    let sessionsCount = 0;
    if (data.generateSessions) {
      const endDate = data.endDate || new Date(new Date().setMonth(new Date().getMonth() + 6));
      sessionsCount = await generateSessions({
        batchId: batch.id,
        teacherId: data.teacherId,
        roomId: data.roomId || null,
        startDate: data.startDate,
        endDate,
        days: data.days,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    }

    return NextResponse.json(
      { batch, enrolledCount, sessionsCount },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
