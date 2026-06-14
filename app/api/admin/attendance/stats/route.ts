import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getBatchWiseAttendancePercentage } from "@/lib/attendanceCalculator";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeklyTrend = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const records = await prisma.attendance.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
          status: {
            notIn: ["HOLIDAY", "CANCELLED"],
          },
        },
      });

      const presentCount = records.filter(
        (record) => record.status === "PRESENT" || record.status === "LATE"
      ).length;
      const percentage = records.length > 0 ? Math.round((presentCount / records.length) * 10000) / 100 : 0;

      weeklyTrend.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        percentage,
      });
    }

    const batchComparison = await getBatchWiseAttendancePercentage(
      new Date(today.getFullYear(), today.getMonth(), 1),
      today
    );

    return NextResponse.json({
      success: true,
      data: {
        weeklyTrend,
        batchComparison,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/attendance/stats]", error);
    return NextResponse.json(
      {
        error: "Failed to fetch attendance stats",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
