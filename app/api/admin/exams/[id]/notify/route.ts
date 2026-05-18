import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: { student: { include: { parent: true } }, exam: true }
    });

    // In a real application, you would integrate with SMS/WhatsApp/Email providers here.
    // For now we will mock sending notifications.
    let count = 0;
    for (const r of results) {
      if (r.student.parent && r.student.parent.fatherPhone) {
        // Notification logic would go here
        count++;
      }
    }

    return NextResponse.json({ success: true, notifiedCount: count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to notify parents" }, { status: 500 });
  }
}
