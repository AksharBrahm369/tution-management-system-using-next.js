import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    const subjects = await prisma.subject.findMany({
      where: active ? { isActive: active === "true" } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("[SUBJECTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
