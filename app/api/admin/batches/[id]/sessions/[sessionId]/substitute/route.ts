import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { sessionSubstituteSchema } from "@/lib/validations/batch";
import { checkSubstituteAvailability } from "@/lib/conflictDetector";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id, sessionId } = await params;
    const body = await request.json();
    const parsed = sessionSubstituteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { substituteId } = parsed.data;

    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, batchId: id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check substitute availability
    const isAvailable = await checkSubstituteAvailability({
      teacherId: substituteId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
    });

    if (!isAvailable) {
      return NextResponse.json(
        { error: "Substitute teacher is not available at this time" },
        { status: 409 }
      );
    }

    const updated = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        hasSubstitute: true,
        substituteId,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
