import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateJWT } from "@/lib/auth";
import { getTodayAttendanceSummary, getBatchWiseAttendancePercentage } from "@/lib/attendanceCalculator";
import { DayOfWeek } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all batches that have class today
    const batchesWithClassToday = await prisma.batch.findMany({
      where: {
        status: "ACTIVE",
        days: {
          hasSome: [
            ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"][
              today.getDay()
            ] as DayOfWeek,
          ],
        },
      },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true },
        },
        subject: { select: { name: true } },
        _count: { select: { enrollments: { where: { isActive: true } } } },
      },
    });

    const batchSummaries = [];

    for (const batch of batchesWithClassToday) {
      // Check if attendance already marked
      const attendanceRecord = await prisma.attendanceSession.findFirst({
        where: {
          batchId: batch.id,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const attendanceCount = attendanceRecord
        ? attendanceRecord.presentCount +
          attendanceRecord.absentCount +
          attendanceRecord.lateCount +
          attendanceRecord.leaveCount
        : 0;

      batchSummaries.push({
        batchId: batch.id,
        batchName: batch.name,
        batchCode: batch.code,
        subject: batch.subject.name,
        teacher: `${batch.teacher.firstName} ${batch.teacher.lastName}`,
        time: `${batch.startTime} - ${batch.endTime}`,
        totalStudents: batch._count.enrollments,
        markedCount: attendanceCount,
        presentCount: attendanceRecord?.presentCount || 0,
        absentCount: attendanceRecord?.absentCount || 0,
        lateCount: attendanceRecord?.lateCount || 0,
        leaveCount: attendanceRecord?.leaveCount || 0,
        isMarked: !!attendanceRecord && attendanceRecord.isComplete,
        markedBy: attendanceRecord?.markedBy,
        markedAt: attendanceRecord?.markedAt,
      });
    }

    // Resolve user names for the 'markedBy' field in batch summaries
    const sessionMarkedByIds = Array.from(
      new Set(
        batchSummaries
          .map((b) => b.markedBy)
          .filter((id) => id && id !== "seed" && id !== "qr_scan")
      )
    );

    const sessionUsers = await prisma.user.findMany({
      where: { id: { in: sessionMarkedByIds as string[] } },
      select: { id: true, name: true },
    });

    const sessionUserMap = new Map(sessionUsers.map((u) => [u.id, u.name]));

    const formattedBatchSummaries = batchSummaries.map((b) => {
      let markedByName = undefined;
      if (b.markedBy) {
        if (b.markedBy === "qr_scan") {
          markedByName = "QR Scan";
        } else if (b.markedBy === "seed") {
          const originalBatch = batchesWithClassToday.find((ob) => ob.id === b.batchId);
          markedByName = originalBatch?.teacher
            ? `${originalBatch.teacher.firstName} ${originalBatch.teacher.lastName}`
            : "System (Seed)";
        } else {
          markedByName = sessionUserMap.get(b.markedBy) || "Administrator";
        }
      }
      return {
        ...b,
        markedBy: markedByName,
      };
    });

    // Calculate overall attendance
    const todaySummary = await getTodayAttendanceSummary();

    // Get this month's average
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyPercentages = await getBatchWiseAttendancePercentage(
      firstDayOfMonth,
      today
    );
    const monthlyAverage =
      monthlyPercentages.length > 0
        ? Math.round(
            (monthlyPercentages.reduce((sum, b) => sum + b.percentage, 0) /
              monthlyPercentages.length) *
              100
          ) / 100
        : 0;

    // Get low attendance alerts count
    const lowAttendanceCount = await prisma.attendanceAlert.count({
      where: { isResolved: false },
    });

    return NextResponse.json({
      success: true,
      data: {
        overallPercentage: todaySummary.percentage,
        presentCount: todaySummary.totalPresent,
        absentCount: todaySummary.totalAbsent,
        lateCount: todaySummary.totalLate,
        onLeaveCount: todaySummary.totalOnLeave,
        notifiedCount: todaySummary.notifiedCount || 0,
        lowAttendanceAlerts: lowAttendanceCount,
        monthlyAverage,
        batchSummaries: formattedBatchSummaries,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/attendance/today]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch today's attendance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
