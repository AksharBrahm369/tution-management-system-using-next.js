import { NextRequest, NextResponse } from "next/server";
import { validateJWT } from "@/lib/auth";
import { deactivateQRSession } from "@/lib/qrGenerator";

export async function POST(req: NextRequest) {
  try {
    const payload = await validateJWT(req);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { batchId } = body;
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const ok = await deactivateQRSession(batchId);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("[POST /api/admin/attendance/qr/deactivate]", error);
    return NextResponse.json({ error: "Failed to deactivate" }, { status: 500 });
  }
}
