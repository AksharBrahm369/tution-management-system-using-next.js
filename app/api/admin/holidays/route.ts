import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { holidayCreateSchema, holidayUpdateSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const year = request.nextUrl.searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (year) {
      const yearNum = parseInt(year);
      where.date = {
        gte: new Date(yearNum, 0, 1),
        lte: new Date(yearNum, 11, 31),
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ holidays });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const body = await request.json();
    const parsed = holidayCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const holiday = await prisma.holiday.create({ data: parsed.data });
    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
