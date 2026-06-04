import { NextRequest, NextResponse } from "next/server";
import { validateJWT } from "@/lib/auth";
import { validateQRScan } from "@/lib/validations/attendance";
import { markAttendanceViaQR } from "@/lib/qrGenerator";

export async function POST(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload) {
      return NextResponse.json({ error: "You must be logged in to mark attendance." }, { status: 401 });
    }

    if (payload.role !== "STUDENT" && payload.role !== "TEACHER") {
      return NextResponse.json(
        { error: `Only students can mark their attendance via QR code. You are currently logged in as ${payload.role}.` },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateQRScan(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { qrToken } = validation.data;

    // Mark attendance via QR
    const result = await markAttendanceViaQR(qrToken, payload.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        attendanceId: result.attendance?.id,
        studentId: result.attendance?.studentId,
        batchId: result.attendance?.batchId,
        status: result.attendance?.status,
        markedAt: result.attendance?.markedAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/attendance/qr/scan]", error);
    return NextResponse.json(
      {
        error: "Failed to mark attendance",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
