import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ success: false, message: "Not implemented" }, { status: 501 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}


