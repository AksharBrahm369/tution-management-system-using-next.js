import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireParent(request);
    const announcements = await prisma.$queryRaw`
      SELECT id, "userId", title, message, audience, channels, "scheduleAt", status, "createdAt", "updatedAt"
      FROM announcements
      ORDER BY "createdAt" DESC
      LIMIT 20
    `;
    return NextResponse.json({ announcements });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
