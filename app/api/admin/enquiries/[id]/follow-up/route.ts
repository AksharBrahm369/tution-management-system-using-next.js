import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { followUpCreateSchema } from "@/lib/validations/enquiry";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = followUpCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const followUp = await prisma.followUp.create({
      data: {
        enquiryId: id,
        type: data.type,
        scheduledAt: data.scheduledAt,
        completedAt: data.completedAt ?? (data.status === "COMPLETED" ? new Date() : null),
        status: data.status ?? "PENDING",
        notes: data.notes || null,
        outcome: data.outcome || null,
        nextFollowUpAt: data.nextFollowUpAt ?? null,
        doneBy: data.doneBy || auth.userId,
      },
    });

    await prisma.enquiry.update({
      where: { id },
      data: {
        status: data.type === "DEMO" ? "DEMO_SCHEDULED" : "CONTACTED",
      },
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
