import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { demoCreateSchema } from "@/lib/validations/enquiry";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = demoCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const demoClass = await prisma.demoClass.create({
      data: {
        enquiryId: id,
        batchId: data.batchId || null,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        status: data.status ?? "SCHEDULED",
        teacherNotes: data.teacherNotes || null,
        parentFeedback: data.parentFeedback || null,
        interested: data.interested ?? null,
      },
    });

    await prisma.enquiry.update({
      where: { id },
      data: {
        status: "DEMO_SCHEDULED",
      },
    });

    return NextResponse.json({ demoClass }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
