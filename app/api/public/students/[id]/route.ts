import { NextRequest, NextResponse } from "next/server";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";
import { applyCorsHeaders, corsOptionsResponse } from "@/lib/cors";
import { resolvePublicInstituteId } from "@/lib/instituteProvisioning";
import { withRequestInstitute, withoutAuthScope } from "@/lib/institute";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response = NextResponse.json({ error: "Missing student ID" }, { status: 400 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    // In multi-tenant database, lookup the student's instituteId first
    const studentInfo = await withoutAuthScope(() =>
      prisma.student.findUnique({
        where: { id },
        select: { instituteId: true }
      })
    );

    let instituteId = studentInfo?.instituteId;
    if (!instituteId) {
      instituteId = await resolvePublicInstituteId();
    }

    if (!instituteId) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    const student = await withRequestInstitute(instituteId, () => getPublicStudentProfile(id));
    if (!student) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }
    const response = NextResponse.json(student, { status: 200 });
    return applyCorsHeaders(request, response, "GET, OPTIONS");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const response = NextResponse.json({ error: message }, { status: 500 });
    return applyCorsHeaders(request, response, "GET, OPTIONS");
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request, "GET, OPTIONS");
}
