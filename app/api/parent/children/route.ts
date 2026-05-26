import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({
      where: { userId: auth.userId },
      include: {
        students: {
          include: {
            batchEnrollments: { where: { isActive: true }, include: { batch: { select: { id: true, name: true, code: true } } } },
            feeRecords: { orderBy: { createdAt: "desc" }, take: 1 },
            examResults: { orderBy: { createdAt: "desc" }, take: 1, include: { exam: { select: { title: true, examDate: true } } } },
          },
        },
      },
    });

    return NextResponse.json({ children: parent?.students ?? [] });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
