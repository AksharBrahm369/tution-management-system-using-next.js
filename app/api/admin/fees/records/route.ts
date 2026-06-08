import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ records: [] });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}


