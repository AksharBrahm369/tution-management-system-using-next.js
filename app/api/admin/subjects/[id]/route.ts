import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { subjectUpdateSchema } from "@/lib/validations/subject";
import { logActivity } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;

    // Verify subject ownership
    const subjectExists = await prisma.subject.findFirst({
      where: { id, instituteId: auth.instituteId },
    });

    if (!subjectExists) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = subjectUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check duplicate code if code is being updated
    if (parsed.data.code) {
      const existing = await prisma.subject.findFirst({
        where: {
          code: parsed.data.code,
          id: { not: id },
          instituteId: auth.instituteId,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Subject code already exists" },
          { status: 409 }
        );
      }
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: parsed.data,
    });

    await logActivity({
      action: "SUBJECT_UPDATED",
      category: "SYSTEM",
      severity: "INFO",
      description: `Subject ${subject.name} (${subject.code}) updated`,
      entityType: "Subject",
      entityId: subject.id,
      entityName: subject.name,
      userId: auth.userId,
    });

    return NextResponse.json({ subject });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;

    // Verify subject ownership
    const subjectExists = await prisma.subject.findFirst({
      where: { id, instituteId: auth.instituteId },
    });

    if (!subjectExists) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if any batches are using this subject
    const activeBatches = await prisma.batch.count({
      where: { subjectId: id, instituteId: auth.instituteId },
    });

    if (activeBatches > 0) {
      return NextResponse.json(
        { error: `Cannot delete subject — it is assigned to ${activeBatches} batch(es)` },
        { status: 400 }
      );
    }

    // Check if any teachers teach this subject
    const teacherCount = await prisma.teacherSubject.count({
      where: { subjectId: id },
    });

    if (teacherCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete subject — it is assigned to ${teacherCount} teacher(s)` },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.delete({
      where: { id },
    });

    await logActivity({
      action: "SUBJECT_DELETED",
      category: "SYSTEM",
      severity: "WARNING",
      description: `Subject ${subject.name} (${subject.code}) deleted`,
      entityType: "Subject",
      entityId: subject.id,
      entityName: subject.name,
      userId: auth.userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
