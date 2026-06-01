import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const users = await prisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "TEACHER"] },
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden")
      ? 403
      : message.startsWith("Unauthorized")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
