import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateJWT } from "@/lib/auth";
import { validateGenerateQR } from "@/lib/validations/attendance";
import { generateQRToken } from "@/lib/qrGenerator";
import { logActivityFromRequest } from "@/lib/activityLogger";

export async function POST(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validation = validateGenerateQR(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { batchId, date, sessionId } = validation.data;

    // Verify batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const qrDate = date ? new Date(date) : new Date();
    qrDate.setHours(0, 0, 0, 0);

    let baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Auto-resolve local IP in development for testing with physical mobile devices on the same Wi-Fi
    if (process.env.NODE_ENV === "development" && (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))) {
      try {
        const os = require("os");
        const interfaces = os.networkInterfaces();
        let localIp = "";
        for (const interfaceName in interfaces) {
          const addresses = interfaces[interfaceName];
          if (addresses) {
            for (const address of addresses) {
              if (address.family === "IPv4" && !address.internal) {
                localIp = address.address;
                break;
              }
            }
          }
          if (localIp) break;
        }
        if (localIp) {
          baseUrl = baseUrl.replace("localhost", localIp).replace("127.0.0.1", localIp);
          console.log(`[QR Generation] Replaced localhost with local IP: ${baseUrl}`);
        }
      } catch (e) {
        console.error("Failed to resolve local IP address for QR code:", e);
      }
    }

    // Generate QR token and code
    const { qrCode, qrToken, expiresAt } = await generateQRToken(
      batchId,
      sessionId,
      qrDate,
      baseUrl
    );

    // Get session details
    const session = await prisma.attendanceSession.findFirst({
      where: {
        batchId,
        date: qrDate,
      },
    });

    await logActivityFromRequest(req, {
      userId: payload.userId,
      action: "QR_CODE_GENERATED",
      category: "ATTENDANCE",
      severity: "INFO",
      description: `QR code generated for batch ${batch.name}`,
      entityType: "Batch",
      entityId: batchId,
      entityName: batch.name,
    });

    return NextResponse.json({
      success: true,
      message: "QR code generated successfully",
      data: {
        qrCode, // Data URL for rendering
        qrToken,
        expiresAt,
        validityMinutes: 30,
        sessionId: session?.id,
        batchId,
        date: qrDate,
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/attendance/qr/generate]", error);
    return NextResponse.json(
      {
        error: "Failed to generate QR code",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
