import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { createExam, listExams } from "@/lib/examService";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const params = request.nextUrl.searchParams;
    const data = await listExams({
      search: params.get("search") ?? undefined,
      status: params.get("status") ?? undefined,
      type: params.get("type") ?? undefined,
      batchId: params.get("batchId") ?? undefined,
      subjectId: params.get("subjectId") ?? undefined,
      fromDate: params.get("fromDate") ?? undefined,
      toDate: params.get("toDate") ?? undefined,
      page: Number(params.get("page")) || 1,
      limit: Number(params.get("limit")) || 20,
    });
    return NextResponse.json(data);
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const exam = await createExam(body, auth.userId);
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "EXAM_CREATED",
      category: "EXAM",
      severity: "INFO",
      description: `Exam created: ${exam.title ?? exam.id}`,
      entityType: "Exam",
      entityId: exam.id,
      entityName: exam.title,
    });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
