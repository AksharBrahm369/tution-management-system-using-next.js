import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { calendarEventCreateSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const year = request.nextUrl.searchParams.get("year");
    const month = request.nextUrl.searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const start = new Date(yearNum, monthNum - 1, 1);
      const end = new Date(yearNum, monthNum, 0, 23, 59, 59);
      where.OR = [
        { startDate: { gte: start, lte: end } },
        { endDate: { gte: start, lte: end } },
      ];
    }

    const events = await prisma.academicCalendar.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ events });
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
    const parsed = calendarEventCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = await prisma.academicCalendar.create({
      data: { ...parsed.data, createdBy: auth.userId },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
