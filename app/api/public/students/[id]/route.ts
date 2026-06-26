import { NextRequest, NextResponse } from "next/server";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";
import { applyCorsHeaders, corsOptionsResponse } from "@/lib/cors";
import { resolvePublicInstituteId } from "@/lib/instituteProvisioning";
import { basePrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response = NextResponse.json({ error: "Missing student ID" }, { status: 400 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    // Use basePrisma directly - bypass the institute-scoping extension which
    // tries to validate session cookies (causing 500 on unauthenticated routes).
    let studentInstituteId: string | null | undefined;
    try {
      const studentInfo = await basePrisma.student.findUnique({
        where: { id },
        select: { instituteId: true },
      });
      studentInstituteId = studentInfo?.instituteId;
    } catch (lookupError) {
      console.error("[public/students] Step 1 DB lookup failed:", lookupError);
    }

    // Resolve instituteId - either from student record or single-tenant fallback
    let instituteId = studentInstituteId;
    if (!instituteId) {
      try {
        instituteId = await resolvePublicInstituteId();
      } catch (resolveError) {
        console.error("[public/students] resolvePublicInstituteId failed:", resolveError);
      }
    }

    if (!instituteId) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    // Fetch full student profile - pass instituteId explicitly to avoid extension scoping
    let student;
    try {
      student = await getPublicStudentProfile(id, instituteId);
    } catch (profileError) {
      console.error("[public/students] getPublicStudentProfile failed:", profileError);
      const response = NextResponse.json(
        { error: "Failed to load student profile" },
        { status: 500 }
      );
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    if (!student) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    // Serialize dates to avoid JSON issues
    const serialized = JSON.parse(JSON.stringify(student));
    const response = NextResponse.json(serialized, { status: 200 });
    return applyCorsHeaders(request, response, "GET, OPTIONS");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[public/students] Unhandled error:", error);
    const response = NextResponse.json({ error: message }, { status: 500 });
    return applyCorsHeaders(request, response, "GET, OPTIONS");
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request, "GET, OPTIONS");
}
