import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { removeStudentSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id, studentId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = removeStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reason, leaveDate } = parsed.data;

    const enrollment = await prisma.batchEnrollment.findFirst({
      where: { batchId: id, studentId, isActive: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    await prisma.batchEnrollment.update({
      where: { id: enrollment.id },
      data: {
        isActive: false,
        leaveDate: leaveDate || new Date(),
        notes: reason,
      },
    });

    // Update batch strength
    const newCount = await prisma.batchEnrollment.count({ where: { batchId: id, isActive: true } });
    await prisma.batch.update({ where: { id }, data: { currentStrength: newCount } });

    return NextResponse.json({ success: true, currentStrength: newCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
