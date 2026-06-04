import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireParent(request);

    if (!authContext.parentId) {
      return NextResponse.json(
        { message: "No parent profile linked to this account." },
        { status: 404 }
      );
    }

    const children = await prisma.student.findMany({
      where: { parentId: authContext.parentId },
      include: {
        batchEnrollments: {
          include: {
            batch: true,
          },
        },
        feeRecords: {
          orderBy: { dueDate: 'asc' },
          where: {
            status: { not: "PAID" },
          },
        },
      },
    });

    // Compute basic attendance summary for each child
    const childrenWithAttendance = await Promise.all(
      children.map(async (child) => {
        const totalAttendance = await prisma.attendance.count({
          where: { studentId: child.id }
        });
        
        const presentCount = await prisma.attendance.count({
          where: { 
            studentId: child.id,
            status: "PRESENT" 
          }
        });

        const attendancePercent = totalAttendance > 0 
          ? Math.round((presentCount / totalAttendance) * 100) 
          : null;

        return {
          ...child,
          attendancePercent
        };
      })
    );

    return NextResponse.json({ children: childrenWithAttendance });
  } catch (error) {
    console.error("Error in GET /api/parent/children:", error);
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ message }, { status });
  }
}
