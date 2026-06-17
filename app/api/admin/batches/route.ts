import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { batchCreateSchema } from "@/lib/validations/batch";
import { generateBatchCode } from "@/lib/batchCode";
import { generateSessions } from "@/lib/sessionGenerator";
import { assignStudentsToBatchStandard, syncTeacherStandardSubjectForBatch, validateStudentsForBatchStandard } from "@/lib/standardAssignments";

export const runtime = "nodejs";

const INDIA_TIMEZONE = "Asia/Kolkata";

type BatchWithRelations = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  subjectId: string;
  teacherId: string;
  days: string[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  roomId: string | null;
  maxStrength: number;
  currentStrength: number;
  academicYear: string;
  startDate: Date;
  endDate: Date | null;
  fees: number;
  status: string;
  isOnline: boolean;
  meetingLink: string | null;
  createdAt: Date;
  updatedAt: Date;
  subject: { id: string; name: string; code: string };
  teacher: { id: string; firstName: string; lastName: string; profilePhoto: string | null };
  room: { id: string; name: string; code: string } | null;
  enrollments: Array<{ id: string }>;
  _count: { sessions: number };
};

function getTimezoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  const month = get("month");
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const weekday = get("weekday").toUpperCase();

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    weekday,
  };
}

function computeLiveBatchStatus(batch: BatchWithRelations) {
  if (batch.status === "CANCELLED" || batch.status === "INACTIVE") {
    return batch.status;
  }

  const now = getTimezoneParts(new Date(), INDIA_TIMEZONE);
  const batchStart = getTimezoneParts(batch.startDate, INDIA_TIMEZONE).date;
  const batchEnd = batch.endDate ? getTimezoneParts(batch.endDate, INDIA_TIMEZONE).date : null;

  if (batch.startDate && batchStart > now.date) {
    return "UPCOMING";
  }

  if (batchEnd && batchEnd < now.date) {
    return "COMPLETED";
  }

  const runsToday = batch.days.includes(now.weekday);
  if (!runsToday) {
    return "UPCOMING";
  }

  if (now.time < batch.startTime) {
    return "UPCOMING";
  }

  if (now.time >= batch.endTime) {
    return "COMPLETED";
  }

  return "ONGOING";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const standardId = searchParams.get("standardId");
    const timeRange = searchParams.get("timeRange");
    const daysParam = searchParams.get("days");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "12"));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { instituteId: auth.instituteId };

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

    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;
    if (standardId) where.standardId = standardId;

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

    const [allBatches, totalCount, totalEnrolled] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy,
        include: {
          subject: true,
          standard: true,
          teacher: { select: { id: true, firstName: true, lastName: true, profilePhoto: true } },
          room: { select: { id: true, name: true, code: true } },
          enrollments: { where: { isActive: true }, select: { id: true } },
          _count: { select: { sessions: true } },
        },
      }),
      prisma.batch.count({ where }),
      prisma.batchEnrollment.count({ where: { isActive: true, batch: where } }),
    ]);

    const computedBatches = allBatches.map((batch) => ({
      ...batch,
      status: computeLiveBatchStatus(batch as BatchWithRelations),
      currentStrength: batch.enrollments.length,
    }));

    const filteredBatches = status
      ? computedBatches.filter((batch) => batch.status === status)
      : computedBatches;

    const total = filteredBatches.length;
    const paginatedBatches = filteredBatches.slice((page - 1) * limit, page * limit);
    const ongoingCount = computedBatches.filter((batch) => batch.status === "ONGOING").length;
    const upcomingCount = computedBatches.filter((batch) => batch.status === "UPCOMING").length;
    const completedCount = computedBatches.filter((batch) => batch.status === "COMPLETED").length;

    return NextResponse.json({
      batches: paginatedBatches,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: totalCount,
        ongoing: ongoingCount,
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

    await validateStudentsForBatchStandard(prisma, data.studentIds ?? [], data.standardId || null);

    const code = data.code || (await generateBatchCode());
    const [sh, sm] = data.startTime.split(":").map(Number);
    const [eh, em] = data.endTime.split(":").map(Number);
    const durationMinutes = eh * 60 + em - (sh * 60 + sm);

    // Check for duplicate code
    const existing = await prisma.batch.findFirst({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Batch code already exists" }, { status: 409 });
    }

    const batch = await prisma.batch.create({
      data: {
        instituteId: auth.instituteId,
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
        standardId: data.standardId || null,
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

    await syncTeacherStandardSubjectForBatch(prisma, batch.id);

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

      await assignStudentsToBatchStandard(prisma, data.studentIds, data.standardId || null);

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
        standardId: data.standardId || null,
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
