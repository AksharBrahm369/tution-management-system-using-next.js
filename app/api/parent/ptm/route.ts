import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } });
    if (!parent) return NextResponse.json({ ptmSlots: [] });

    const ptmSlots = await prisma.pTMSlot.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: "desc" },
      include: {
        meeting: true,
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        teacher: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ptmSlots });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
