import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const feedback = await prisma.parentFeedback.update({
      where: { id },
      data: {
        adminResponse: body.adminResponse,
        status: body.status ?? "RESOLVED",
        respondedBy: auth.userId,
        respondedAt: new Date(),
      },
    });
    return NextResponse.json({ feedback }, { status: 200 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
