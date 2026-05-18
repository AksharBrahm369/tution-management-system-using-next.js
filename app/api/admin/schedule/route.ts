import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get("view") || "week";
    const dateParam = searchParams.get("date");
    const teacherIdFilter = searchParams.get("teacherId");
    const subjectIdFilter = searchParams.get("subjectId");
    const roomIdFilter = searchParams.get("roomId");

    const baseDate = dateParam ? new Date(dateParam) : new Date();

    let startDate: Date;
    let endDate: Date;

    if (view === "day") {
      startDate = new Date(baseDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(baseDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "month") {
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // week
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(baseDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const where: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
    };

    if (teacherIdFilter) where.teacherId = teacherIdFilter;
    if (roomIdFilter) where.roomId = roomIdFilter;

    const [sessions, holidays, events] = await Promise.all([
      prisma.classSession.findMany({
        where,
        include: {
          batch: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              subjectId: true,
              ...(subjectIdFilter ? { subject: true } : {}),
              teacher: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          room: { select: { id: true, name: true } },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      prisma.holiday.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.academicCalendar.findMany({
        where: {
          OR: [
            { startDate: { gte: startDate, lte: endDate } },
            { endDate: { gte: startDate, lte: endDate } },
          ],
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    // Filter by subject if needed
    const filteredSessions = subjectIdFilter
      ? sessions.filter((s) => s.batch.subjectId === subjectIdFilter)
      : sessions;

    return NextResponse.json({
      sessions: filteredSessions,
      holidays,
      events,
      range: { startDate, endDate },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
