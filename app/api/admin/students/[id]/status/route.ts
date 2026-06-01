import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { studentStatusUpdateSchema } from "@/lib/validations/student";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = studentStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await prisma.studentActivity.create({
      data: {
        studentId: id,
        type: "STATUS_CHANGED",
        title: "Status Updated",
        description: `Status changed to ${parsed.data.status}. Reason: ${parsed.data.reason}`,
        metadata: {
          reason: parsed.data.reason,
          effectiveDate: parsed.data.effectiveDate?.toISOString() ?? null,
          changedBy: auth.userId,
        },
        performedById: auth.userId,
      },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_STATUS_CHANGED",
      category: "STUDENT",
      severity: "WARNING",
      description: `Student status changed to ${parsed.data.status}`,
      entityType: "Student",
      entityId: id,
      newValue: { status: parsed.data.status, reason: parsed.data.reason },
    });

    return NextResponse.json({ student }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
