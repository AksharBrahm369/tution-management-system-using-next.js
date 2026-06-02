import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
};

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10) || 10);
    const today = new Date();
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: today },
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
      include: {
        enquiry: {
          select: {
            id: true,
            enquiryNumber: true,
            studentName: true,
            parentName: true,
            parentPhone: true,
            status: true,
            priority: true,
            source: true,
            assignedTo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        followUps: dueFollowUps.map((item) => ({
          id: item.id,
          enquiryId: item.enquiryId,
          enquiryNumber: item.enquiry.enquiryNumber,
          studentName: item.enquiry.studentName,
          parentName: item.enquiry.parentName,
          parentPhone: item.enquiry.parentPhone,
          status: item.enquiry.status,
          priority: item.enquiry.priority,
          source: item.enquiry.source,
          assignedTo: item.enquiry.assignedTo,
          type: item.type,
          scheduledAt: item.scheduledAt.toISOString(),
          notes: item.notes,
          outcome: item.outcome,
        })),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
