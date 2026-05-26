import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } });
    const feedback = parent
      ? await prisma.parentFeedback.findMany({ where: { parentId: parent.id }, orderBy: { createdAt: "desc" } })
      : [];
    return NextResponse.json({ feedback });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId } });
    if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });

    const body = await request.json();
    const feedback = await prisma.parentFeedback.create({
      data: {
        parentId: parent.id,
        studentId: body.studentId,
        teacherId: body.teacherId ?? null,
        batchId: body.batchId ?? null,
        subject: body.subject,
        message: body.message,
        type: body.type,
        rating: body.rating ?? null,
      },
    });
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
