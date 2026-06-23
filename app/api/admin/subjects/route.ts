import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { subjectCreateSchema } from "@/lib/validations/subject";
import { logActivity } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const standardId = searchParams.get("standardId");

    const isActive = active ? active === "true" : undefined;

    let subjects = [];
    if (standardId) {
      subjects = await prisma.subject.findMany({
        where: {
          instituteId: auth.instituteId,
          isActive,
          OR: [
            { batches: { some: { standardId } } },
            { teacherStandardSubjects: { some: { standardId } } },
            { exams: { some: { standardId } } },
            { materials: { some: { standardId } } },
          ],
        },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              batches: { where: { status: "ACTIVE", standardId } },
              teachers: true,
            },
          },
        },
      });
    }

    if (subjects.length === 0) {
      subjects = await prisma.subject.findMany({
        where: {
          instituteId: auth.instituteId,
          isActive,
        },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              batches: { where: { status: "ACTIVE" } },
              teachers: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ subjects });
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
    const parsed = subjectCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, code, description, isActive } = parsed.data;

    // Check for duplicate code
    const existing = await prisma.subject.findFirst({
      where: { code, instituteId: auth.instituteId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Subject code already exists" },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        instituteId: auth.instituteId,
        name,
        code,
        description: description || null,
        isActive,
      },
    });

    await logActivity({
      action: "SUBJECT_ADDED",
      category: "SYSTEM",
      severity: "INFO",
      description: `Subject ${subject.name} (${subject.code}) added`,
      entityType: "Subject",
      entityId: subject.id,
      entityName: subject.name,
      userId: auth.userId,
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
