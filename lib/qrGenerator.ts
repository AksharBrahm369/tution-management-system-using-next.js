import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate QR token and code for attendance session
 */
export async function generateQRToken(
  batchId: string,
  sessionId?: string,
  date?: Date
): Promise<{
  qrCode: string;
  qrToken: string;
  expiresAt: Date;
}> {
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute validity

  // Generate QR code with token
  const qrCode = await QRCode.toDataURL(token, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Store in database
  await prisma.attendanceSession.updateMany({
    where: {
      batchId,
      date: date ? {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      } : undefined,
    },
    data: {
      qrCode: token,
      qrExpiresAt: expiresAt,
      qrIsActive: true,
    },
  });

  return {
    qrCode,
    qrToken: token,
    expiresAt,
  };
}

/**
 * Validate QR token
 */
export async function validateQRToken(token: string): Promise<{
  valid: boolean;
  batchId?: string;
  date?: Date;
  message: string;
} | null> {
  const session = await prisma.attendanceSession.findFirst({
    where: {
      qrCode: token,
      qrIsActive: true,
    },
  });

  if (!session) {
    return {
      valid: false,
      message: "Invalid QR code",
    };
  }

  if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
    // Mark as expired
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { qrIsActive: false },
    });

    return {
      valid: false,
      message: "QR code has expired",
    };
  }

  return {
    valid: true,
    batchId: session.batchId,
    date: session.date,
    message: "Valid QR code",
  };
}

/**
 * Mark student as present via QR code
 */
export async function markAttendanceViaQR(token: string, studentId: string) {
  const validation = await validateQRToken(token);

  if (!validation?.valid) {
    return {
      success: false,
      message: validation?.message || "Invalid QR code",
    };
  }

  try {
    const session = await prisma.attendanceSession.findFirst({
      where: { qrCode: token },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!session) {
      return {
        success: false,
        message: "Session not found",
      };
    }

    // Check if student is enrolled in this batch
    if (session.batch.enrollments.length === 0) {
      return {
        success: false,
        message: "Student not enrolled in this batch",
      };
    }

    // Mark attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_batchId_date: {
          studentId,
          batchId: session.batchId,
          date: new Date(
            session.date.getFullYear(),
            session.date.getMonth(),
            session.date.getDate()
          ),
        },
      },
      create: {
        studentId,
        batchId: session.batchId,
        date: new Date(
          session.date.getFullYear(),
          session.date.getMonth(),
          session.date.getDate()
        ),
        status: "PRESENT",
        markedAt: new Date(),
        markedBy: "qr_scan",
        markedViaQR: true,
        qrToken: token,
      },
      update: {
        status: "PRESENT",
        markedAt: new Date(),
        markedViaQR: true,
        qrToken: token,
      },
    });

    // Update session count
    await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        presentCount: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      message: "Attendance marked successfully",
      attendance,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error marking attendance: " + (error instanceof Error ? error.message : "Unknown error"),
    };
  }
}

/**
 * Generate QR code canvas URL for rendering
 */
export async function generateQRDataURL(text: string): Promise<string> {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataURL;
  } catch (error) {
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Deactivate QR code session
 */
export async function deactivateQRSession(batchId: string): Promise<boolean> {
  try {
    await prisma.attendanceSession.updateMany({
      where: {
        batchId,
        qrIsActive: true,
      },
      data: {
        qrIsActive: false,
      },
    });
    return true;
  } catch (error) {
    console.error("Error deactivating QR session:", error);
    return false;
  }
}

/**
 * Get active QR session details
 */
export async function getActiveQRSession(batchId: string) {
  const session = await prisma.attendanceSession.findFirst({
    where: {
      batchId,
      qrIsActive: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.qrExpiresAt && new Date() > session.qrExpiresAt) {
    await deactivateQRSession(batchId);
    return null;
  }

  return {
    sessionId: session.id,
    qrToken: session.qrCode,
    expiresAt: session.qrExpiresAt,
    timeRemainingSeconds: session.qrExpiresAt
      ? Math.max(
          0,
          Math.floor(
            (session.qrExpiresAt.getTime() - new Date().getTime()) / 1000
          )
        )
      : 0,
    presentCount: session.presentCount,
    totalStudents: session.totalStudents,
  };
}
