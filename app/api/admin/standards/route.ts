import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getActiveStandards } from "@/lib/standards";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const standards = await getActiveStandards();
    const now = new Date();

    const standardsWithStats = await Promise.all(
      standards.map(async (standard) => {
        const standardStudentWhere = { standardId: standard.id };

        const [totalStudents, totalTeachers, activeBatches, upcomingExams, pendingFeeAggregate] = await Promise.all([
          prisma.student.count({ where: standardStudentWhere }),
          prisma.teacher.count({
            where: {
              OR: [
                { standardSubjects: { some: { standardId: standard.id } } },
                { batches: { some: { standardId: standard.id } } },
              ],
            },
          }),
          prisma.batch.count({ where: { standardId: standard.id, status: { in: ["ACTIVE", "UPCOMING"] } } }),
          prisma.exam.count({
            where: {
              OR: [{ standardId: standard.id }, { batch: { standardId: standard.id } }],
              examDate: { gte: now },
              status: { in: ["UPCOMING", "ONGOING"] },
            },
          }),
          prisma.feeRecord.aggregate({
            where: {
              pendingAmount: { gt: 0 },
              OR: [{ student: { standardId: standard.id } }, { batch: { standardId: standard.id } }],
            },
            _sum: { pendingAmount: true },
          }),
        ]);

        return {
          ...standard,
          stats: {
            totalStudents,
            totalTeachers,
            activeBatches,
            upcomingExams,
            pendingFees: pendingFeeAggregate._sum.pendingAmount ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ standards: standardsWithStats });
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const order = Number(body.order);

    if (!name) {
      return NextResponse.json({ error: "Standard name is required" }, { status: 400 });
    }

    if (!Number.isInteger(order) || order <= 0 || order > 100) {
      return NextResponse.json({ error: "Standard order must be a number between 1 and 100" }, { status: 400 });
    }

    const existing = await prisma.standard.findFirst({
      where: {
        OR: [{ name: { equals: name, mode: "insensitive" } }, { order }],
      },
      select: { id: true, name: true, order: true, isActive: true },
    });

    if (existing) {
      if (!existing.isActive) {
        const standard = await prisma.standard.update({
          where: { id: existing.id },
          data: { name, order, isActive: true },
        });

        return NextResponse.json({ standard }, { status: 200 });
      }

      const field = existing.order === order ? "order" : "name";
      return NextResponse.json({ error: `A standard with this ${field} already exists` }, { status: 409 });
    }

    const standard = await prisma.standard.create({
      data: { name, order, isActive: true },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STANDARD_ADDED",
      category: "SETTINGS",
      severity: "INFO",
      description: `Standard ${standard.name} added`,
      entityType: "Standard",
      entityId: standard.id,
      entityName: standard.name,
    });

    return NextResponse.json({ standard }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
