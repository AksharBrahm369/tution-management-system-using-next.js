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
          include: {
            batch: true,
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 10, // Last 10 attendance records for summary
        },
        feeRecords: {
          orderBy: { dueDate: 'asc' },
          where: {
            status: { not: "PAID" }, // Get pending or overdue fees
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

    // Compute basic attendance summary (overall would require a bigger query, 
    // but for now we can just return the data or basic count if needed)
    const totalAttendance = await prisma.attendance.count({
      where: { studentId: authContext.studentId }
    });
    
    const presentCount = await prisma.attendance.count({
      where: { 
        studentId: authContext.studentId,
        status: "PRESENT" 
      }
    });

    const attendancePercent = totalAttendance > 0 
      ? Math.round((presentCount / totalAttendance) * 100) 
      : null;

    return NextResponse.json({ 
      student,
      summary: {
        attendancePercent,
      }
    });
  } catch (error) {
    console.error("Error in GET /api/student/me:", error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ message }, { status });
  }
}
