import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const exam = await prisma.exam.findUnique({ 
      where: { id },
      include: { batch: true }
    });
    
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    if (exam.batch.teacherId !== teacher.id) return NextResponse.json({ error: "Not authorized for this batch" }, { status: 403 });

    // Re-use admin marks route logic by making a fetch call or redirecting.
    // Since we're in the same app, it's cleaner to abstract the logic or just call the admin API directly.
    const url = new URL(`/api/admin/exams/${id}/marks`, req.url);
    const body = await req.json();
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit marks" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const url = new URL(`/api/admin/exams/${id}/marks`, req.url);
    const res = await fetch(url.toString(), {
      headers: { 'Cookie': req.headers.get('cookie') || '' }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch marks" }, { status: 500 });
  }
}
