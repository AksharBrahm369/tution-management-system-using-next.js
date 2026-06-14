import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { getActiveQRSession } from "@/lib/qrGenerator";

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const batchId = req.nextUrl.searchParams.get("batchId") ?? undefined;
    if (!batchId) return NextResponse.json({ data: null });

    const session = await getActiveQRSession(batchId);
    return NextResponse.json({ data: session });
  } catch (error) {
    console.error("[GET /api/admin/attendance/qr/active]", error);
    return NextResponse.json({ error: "Failed to get active session" }, { status: 500 });
  }
}
