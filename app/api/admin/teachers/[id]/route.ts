import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: { subject: true }
        },
        batches: {
          include: { subject: true }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
