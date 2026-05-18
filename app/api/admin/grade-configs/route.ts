import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const configs = await prisma.gradeConfig.findMany({
      include: { grades: { orderBy: { minPercentage: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch grade configs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    if (body.isDefault) {
      await prisma.gradeConfig.updateMany({ data: { isDefault: false } });
    }

    const config = await prisma.gradeConfig.create({
      data: {
        name: body.name,
        description: body.description,
        isDefault: body.isDefault || false,
        grades: {
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

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create grade config" }, { status: 500 });
  }
}
