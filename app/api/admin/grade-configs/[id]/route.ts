import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (body.isDefault) {
      await prisma.gradeConfig.updateMany({ data: { isDefault: false } });
    }

    const updated = await prisma.gradeConfig.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        isDefault: body.isDefault,
        grades: {
          deleteMany: {},
          create: body.grades.map((g: any) => ({
            grade: g.grade,
            minPercentage: g.minPercentage,
            maxPercentage: g.maxPercentage,
            gradePoint: g.gradePoint,
            remark: g.remark,
            color: g.color
          }))
        }
      },
      include: { grades: true }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update grade config" }, { status: 500 });
  }
}
