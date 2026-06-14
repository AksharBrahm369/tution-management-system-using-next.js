import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { withRequestInstitute } from "@/lib/institute";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const auth = await requireSuperAdmin(req);

    const { sessionId } = await params;

    // Verify session exists
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "connected",
            message: "Connected to attendance live stream",
            timestamp: new Date(),
          })}\n\n`
        );

        // Poll for updates every 2 seconds
        const interval = setInterval(async () => {
          try {
            await withRequestInstitute(auth.instituteId, async () => {
              // Get latest attendance count for this session
              const updatedSession = await prisma.attendanceSession.findUnique({
                where: { id: sessionId },
              });

              if (!updatedSession) {
                clearInterval(interval);
                controller.enqueue(
                  `data: ${JSON.stringify({
                    type: "error",
                    message: "Session ended",
                  })}\n\n`
                );
                controller.close();
                return;
              }

              // Get all attendance records for this session
              const attendanceRecords = await prisma.attendance.findMany({
                where: {
                  batchId: updatedSession.batchId,
                  date: updatedSession.date,
                },
                include: {
                  student: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      profilePhoto: true,
                    },
                  },
                },
                orderBy: { markedAt: "desc" },
                take: 1,
              });

              if (attendanceRecords.length > 0) {
                const record = attendanceRecords[0];
                
                // Send update event
                controller.enqueue(
                  `data: ${JSON.stringify({
                    type: "attendance_marked",
                    studentName: `${record.student.firstName} ${record.student.lastName}`,
                    status: record.status,
                    markedAt: record.markedAt,
                    totalPresent: updatedSession.presentCount,
                    totalMarked: 
                      updatedSession.presentCount +
                      updatedSession.absentCount +
                      updatedSession.lateCount +
                      updatedSession.leaveCount,
                    totalStudents: updatedSession.totalStudents,
                    percentage:
                      updatedSession.totalStudents > 0
                        ? Math.round(
                            ((updatedSession.presentCount +
                              updatedSession.lateCount) /
                              updatedSession.totalStudents) *
                              100
                          )
                        : 0,
                  })}\n\n`
                );
              }

              // Check if QR is still active
              if (!updatedSession.qrIsActive) {
                clearInterval(interval);
                controller.enqueue(
                  `data: ${JSON.stringify({
                    type: "qr_deactivated",
                    message: "QR code session ended",
                  })}\n\n`
                );
                controller.close();
              }
            });
          } catch (error) {
            console.error("SSE Error:", error);
            clearInterval(interval);
            controller.close();
          }
        }, 2000);

        // Cleanup on client disconnect
        const abortHandler = () => {
          clearInterval(interval);
          controller.close();
        };

        req.signal.addEventListener("abort", abortHandler);
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/attendance/live/[sessionId]]", error);
    return NextResponse.json(
      {
        error: "Failed to establish stream",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
