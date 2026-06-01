import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const [students, teachers, batches] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { studentCode: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, studentCode: true },
        take: 5,
      }),
      prisma.teacher.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { teacherCode: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, firstName: true, lastName: true },
        take: 5,
      }),
      prisma.batch.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, code: true },
        take: 5,
      }),
    ]);

    const results = [
      ...students.map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName} (${s.studentCode})`,
        type: "student",
        link: `/admin/students/${s.id}`,
      })),
      ...teachers.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        type: "teacher",
        link: `/admin/teachers/${t.id}`,
      })),
      ...batches.map((b) => ({
        id: b.id,
        name: `${b.name} (${b.code})`,
        type: "batch",
        link: `/admin/batches/${b.id}`,
      })),
    ];

    return NextResponse.json({ results }, { status: 200 });
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
