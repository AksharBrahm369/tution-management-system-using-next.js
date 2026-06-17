import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { roomCreateSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const rooms = await prisma.room.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { batches: { where: { status: "ACTIVE" } } } },
      },
    });
    return NextResponse.json({ rooms });
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
    const parsed = roomCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.room.findFirst({ where: { code: parsed.data.code } });
    if (existing) {
      return NextResponse.json({ error: "Room code already exists" }, { status: 409 });
    }

    const room = await prisma.room.create({ data: parsed.data });
    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
