import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateJWT } from "@/lib/auth";
import { validateAttendanceFilters } from "@/lib/validations/attendance";

export async function GET(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const batchId = searchParams.get("batchId");
    const studentId = searchParams.get("studentId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (batchId) where.batchId = batchId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentCode: true,
              profilePhoto: true,
            },
          },
          batch: {
            select: { 
              id: true, 
              name: true, 
              code: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    // Resolve user names for the 'markedBy' field
    const userIds = Array.from(
      new Set(
        records
          .map((r) => r.markedBy)
          .filter((id) => id && id !== "seed" && id !== "qr_scan")
      )
    );

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const formattedRecords = records.map((r) => {
      let markedByName = "System";
      if (r.markedBy === "qr_scan") {
        markedByName = "QR Scan";
      } else if (r.markedBy === "seed") {
        markedByName = r.batch?.teacher 
          ? `${r.batch.teacher.firstName} ${r.batch.teacher.lastName}`
          : "System (Seed)";
      } else {
        markedByName = userMap.get(r.markedBy) || "Administrator";
      }
      return {
        ...r,
        markedBy: markedByName,
      };
    });

    // Calculate summary
    const summary = {
      present: formattedRecords.filter((r) => r.status === "PRESENT").length,
      absent: formattedRecords.filter((r) => r.status === "ABSENT").length,
      late: formattedRecords.filter((r) => r.status === "LATE").length,
      onLeave: formattedRecords.filter((r) => r.status === "ON_LEAVE").length,
      percentage:
        formattedRecords.length > 0
          ? Math.round(
              ((formattedRecords.filter(
                (r) => r.status === "PRESENT" || r.status === "LATE"
              ).length /
                formattedRecords.length) *
                100 *
                100) /
              100
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        records: formattedRecords,
        summary,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/attendance]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch attendance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
