import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parent = await prisma.parent.findUnique({ where: { id } });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const email = body.email || parent.fatherEmail || parent.motherEmail || parent.guardianEmail;
    if (!email) return NextResponse.json({ error: "Parent email is required" }, { status: 400 });

    const name = parent.fatherName || parent.motherName || parent.guardianName || "Parent";
    const password = body.password || `Parent@${randomUUID().slice(0, 8)}`;
    const hashed = await hashPassword(password);

    const user = parent.userId
      ? await prisma.user.update({
          where: { id: parent.userId },
          data: { email, name, password: hashed, role: "PARENT", isActive: true, isVerified: true },
        })
      : await prisma.user.create({
          data: { email, name, password: hashed, role: "PARENT", isActive: true, isVerified: true },
        });

    await prisma.parent.update({ where: { id }, data: { userId: user.id } });

    const { logActivityFromRequest } = await import("@/lib/activityLogger");
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "ADMIN_PASSWORD_RESET",
      category: "USER_MANAGEMENT",
      severity: "WARNING",
      description: `Parent portal login account configured for ${name}`,
      entityType: "Parent",
      entityId: parent.id,
      metadata: { accountUserId: user.id, email },
    });

    return NextResponse.json({ message: "Login account ready", email, password }, { status: 200 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
