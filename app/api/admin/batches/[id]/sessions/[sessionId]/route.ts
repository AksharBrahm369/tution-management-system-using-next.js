import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { sessionUpdateSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id, sessionId } = await params;

    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, batchId: id },
      include: {
        room: true,
        attendance: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, studentCode: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id, sessionId } = await params;
    const body = await request.json();
    const parsed = sessionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, batchId: id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.classSession.update({
      where: { id: sessionId },
      data: parsed.data,
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
