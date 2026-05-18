import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { sessionCancelSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id, sessionId } = await params;
    const body = await request.json();
    const parsed = sessionCancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, batchId: id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CANCELLED") {
      return NextResponse.json({ error: "Session already cancelled" }, { status: 400 });
    }

    const updated = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledBy: auth.userId,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
