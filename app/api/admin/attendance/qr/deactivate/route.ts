import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { deactivateQRSession } from "@/lib/qrGenerator";

export async function POST(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

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
