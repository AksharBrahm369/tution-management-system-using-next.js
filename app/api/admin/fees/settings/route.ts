import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ settings: {} });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ success: false, message: "Not implemented" }, { status: 501 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}


