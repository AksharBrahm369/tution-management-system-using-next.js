import os from "node:os";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { validateGenerateQR } from "@/lib/validations/attendance";
import { generateQRToken } from "@/lib/qrGenerator";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { getAppUrl } from "@/lib/appUrl";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);

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

    let baseUrl = getAppUrl(req);

    // Auto-resolve local IP when testing locally so mobile devices on the same Wi-Fi can connect
    if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      try {
        const interfaces = os.networkInterfaces();
        const candidates: string[] = [];

        const isPreferredLanIp = (ip: string) =>
          ip.startsWith('192.168.') ||
          ip.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

        for (const interfaceName in interfaces) {
          const addresses = interfaces[interfaceName];
          if (addresses) {
            for (const address of addresses) {
              const family = address.family;
              const isIpv4 = family === "IPv4" || (family as any) === 4;
              if (isIpv4 && !address.internal) {
                candidates.push(address.address);
              }
            }
          }
        }

        const localIp = candidates.find(isPreferredLanIp) ?? candidates[0];
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
      userId: auth.userId,
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
