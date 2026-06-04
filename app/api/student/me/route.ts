import { NextRequest, NextResponse } from "next/server";
import { requireStudent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireStudent(request);

    if (!authContext.studentId) {
      return NextResponse.json(
        { message: "No student profile linked to this account." },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: authContext.studentId },
      include: {
        batchEnrollments: {
          where: { isActive: true },
          orderBy: { enrollDate: "desc" },
          include: {
            batch: {
              include: {
                room: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 10,
        },
        feeRecords: {
          orderBy: [{ year: "desc" }, { month: "desc" }, { dueDate: "desc" }],
          include: {
            batch: true,
            payments: {
              orderBy: { paidAt: "desc" },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student profile not found." },
        { status: 404 }
      );
    }

    const totalAttendance = await prisma.attendance.count({
      where: { studentId: authContext.studentId },
    });

    const presentCount = await prisma.attendance.count({
      where: {
        studentId: authContext.studentId,
        status: "PRESENT",
      },
    });

    const attendancePercent = totalAttendance > 0
      ? Math.round((presentCount / totalAttendance) * 100)
      : null;

    const totalBilled = student.feeRecords.reduce((sum, record) => sum + record.totalAmount, 0);
    const totalPaid = student.feeRecords.reduce((sum, record) => sum + record.paidAmount, 0);
    const pendingFees = student.feeRecords.reduce((sum, record) => sum + record.pendingAmount, 0);
    const pendingRecords = student.feeRecords.filter((record) => record.pendingAmount > 0).length;
    const currentBatch = student.batchEnrollments[0]?.batch ?? null;

    return NextResponse.json({
      student,
      summary: {
        attendancePercent,
        totalAttendance,
        presentCount,
        totalBilled,
        totalPaid,
        pendingFees,
        pendingRecords,
        currentBatch,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/student/me:", error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ message }, { status });
  }
}
