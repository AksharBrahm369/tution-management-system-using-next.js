import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { getParentProfile } from "@/lib/parentManagement";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parent = await getParentProfile(id);
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    return NextResponse.json({ parent });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
