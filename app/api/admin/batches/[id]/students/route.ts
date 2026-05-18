import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { enrollStudentsSchema } from "@/lib/validations/batch";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const search = request.nextUrl.searchParams.get("search")?.trim();

    const enrollments = await prisma.batchEnrollment.findMany({
      where: {
        batchId: id,
        isActive: true,
        ...(search
          ? {
              student: {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { studentCode: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentCode: true,
            profilePhoto: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { enrollDate: "asc" },
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = enrollStudentsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const batch = await prisma.batch.findUnique({
      where: { id },
      select: { maxStrength: true, currentStrength: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const { studentIds, notes } = parsed.data;

    const currentCount = await prisma.batchEnrollment.count({
      where: { batchId: id, isActive: true },
    });

    if (currentCount + studentIds.length > batch.maxStrength) {
      return NextResponse.json(
        { error: `Cannot enroll ${studentIds.length} students. Only ${batch.maxStrength - currentCount} seats available.` },
        { status: 400 }
      );
    }

    const enrollments = studentIds.map((studentId) => ({
      studentId,
      batchId: id,
      enrolledBy: auth.userId,
      isActive: true,
      notes: notes || null,
    }));

    await prisma.batchEnrollment.createMany({ data: enrollments, skipDuplicates: true });

    // Update current strength
    const newCount = await prisma.batchEnrollment.count({ where: { batchId: id, isActive: true } });
    await prisma.batch.update({ where: { id }, data: { currentStrength: newCount } });

    return NextResponse.json({ enrolled: studentIds.length, currentStrength: newCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
