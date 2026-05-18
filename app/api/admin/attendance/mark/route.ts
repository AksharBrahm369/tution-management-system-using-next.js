import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateJWT } from "@/lib/auth";
import { validateMarkAttendance } from "@/lib/validations/attendance";
import {
  notifyAbsentParents,
  sendLowAttendanceAlert,
} from "@/lib/notificationService";
import { calculateAttendancePercentage, checkLowAttendance } from "@/lib/attendanceCalculator";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateMarkAttendance(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { batchId, date, attendance, sessionId, notifyParents } =
      validation.data;
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { enrollments: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    // Check for holiday
    const holiday = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: attendanceDate,
          lt: new Date(
            attendanceDate.getFullYear(),
            attendanceDate.getMonth(),
            attendanceDate.getDate() + 1
          ),
        },
      },
    });

    if (holiday) {
      return NextResponse.json(
        {
          error: "Holiday",
          message: `Cannot mark attendance on ${holiday.name}`,
        },
        { status: 400 }
      );
    }

    // Create or update attendance records
    const createdAttendance = [];
    const absentStudents = [];

    for (const record of attendance) {
      // Verify student is enrolled in batch
      const enrollment = await prisma.batchEnrollment.findUnique({
        where: {
          studentId_batchId: {
            studentId: record.studentId,
            batchId,
          },
        },
      });

      if (!enrollment) {
        continue; // Skip if not enrolled
      }

      const attendanceRecord = await prisma.attendance.upsert({
        where: {
          studentId_batchId_date: {
            studentId: record.studentId,
            batchId,
            date: attendanceDate,
          },
        },
        create: {
          studentId: record.studentId,
          batchId,
          date: attendanceDate,
          status: record.status as any,
          markedAt: new Date(),
          markedBy: payload.userId,
          lateMinutes: record.lateMinutes,
          arrivalTime: record.arrivalTime,
          leaveReason: record.leaveReason,
        },
        update: {
          status: record.status as any,
          markedAt: new Date(),
          markedBy: payload.userId,
          lateMinutes: record.lateMinutes,
          arrivalTime: record.arrivalTime,
          leaveReason: record.leaveReason,
        },
      });

      createdAttendance.push(attendanceRecord);

      // Track absent students for notification
      if (record.status === "ABSENT") {
        absentStudents.push({
          studentId: record.studentId,
          batchId,
          date: attendanceDate,
          batchName: batch.name,
        });
      }
    }

    // Update or create attendance session
    const session = await prisma.attendanceSession.upsert({
      where: {
        batchId_date: {
          batchId,
          date: attendanceDate,
        },
      },
      create: {
        batchId,
        date: attendanceDate,
        markedBy: payload.userId,
        isComplete: true,
        completedAt: new Date(),
        totalStudents: attendance.length,
        presentCount: attendance.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length,
        absentCount: attendance.filter((a) => a.status === "ABSENT").length,
        lateCount: attendance.filter((a) => a.status === "LATE").length,
        leaveCount: attendance.filter((a) => a.status === "ON_LEAVE").length,
      },
      update: {
        markedBy: payload.userId,
        markedAt: new Date(),
        isComplete: true,
        completedAt: new Date(),
        totalStudents: attendance.length,
        presentCount: attendance.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length,
        absentCount: attendance.filter((a) => a.status === "ABSENT").length,
        lateCount: attendance.filter((a) => a.status === "LATE").length,
        leaveCount: attendance.filter((a) => a.status === "ON_LEAVE").length,
      },
    });

    // Send notifications if requested
    let notificationsSent = { success: 0, failed: 0 };
    if (notifyParents && absentStudents.length > 0) {
      const result = await notifyAbsentParents(absentStudents);
      notificationsSent = { success: result.sent, failed: result.failed };
    }

    // Check for low attendance and create alerts
    const alerts = [];
    for (const record of createdAttendance) {
      const lowAttendance = await checkLowAttendance(
        record.studentId,
        batchId,
        75
      );

      if (lowAttendance) {
        // Create or update alert
        const alert = await prisma.attendanceAlert.findFirst({
          where: {
            studentId: record.studentId,
            batchId,
            isResolved: false,
          },
        });

        if (!alert) {
          const newAlert = await prisma.attendanceAlert.create({
            data: {
              studentId: record.studentId,
              batchId,
              alertType: "LOW_ATTENDANCE",
              currentPercent: lowAttendance.percentage,
              threshold: 75,
              message: lowAttendance.message,
            },
          });
          alerts.push(newAlert);

          // Send alert to parent
          await sendLowAttendanceAlert(
            record.studentId,
            batchId,
            lowAttendance.percentage
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        sessionId: session.id,
        attendanceRecordsCount: createdAttendance.length,
        summary: {
          total: attendance.length,
          present: attendance.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
          ).length,
          absent: attendance.filter((a) => a.status === "ABSENT").length,
          late: attendance.filter((a) => a.status === "LATE").length,
          onLeave: attendance.filter((a) => a.status === "ON_LEAVE").length,
        },
        notificationsSent,
        alertsCreated: alerts.length,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/attendance/mark]", error);
    return NextResponse.json(
      {
        error: "Failed to mark attendance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
