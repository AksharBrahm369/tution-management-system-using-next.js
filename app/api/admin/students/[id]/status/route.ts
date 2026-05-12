import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { studentStatusUpdateSchema } from "@/lib/validations/student";

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

    return NextResponse.json({ student }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
