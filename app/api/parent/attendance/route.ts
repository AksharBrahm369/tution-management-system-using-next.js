import { NextRequest, NextResponse } from "next/server";
import { requireParent, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireParent(request);
    const parent = await prisma.parent.findUnique({ where: { userId: auth.userId }, include: { students: true } });
    if (!parent) return NextResponse.json({ attendance: [] });
    const attendance = await prisma.attendance.findMany({ where: { studentId: { in: parent.students.map((student) => student.id) } }, orderBy: { date: "desc" }, take: 30 });
    return NextResponse.json({ attendance });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
