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

    // Step 1: Look up the student's instituteId without auth scope
    let studentInstituteId: string | null | undefined;
    try {
      const studentInfo = await withoutAuthScope(() =>
        prisma.student.findUnique({
          where: { id },
          select: { instituteId: true },
        })
      );
      studentInstituteId = studentInfo?.instituteId;
    } catch (lookupError) {
      console.error("[public/students] Step 1 DB lookup failed:", lookupError);
      // Don't fail hard here - try to resolve institute another way
    }

    // Step 2: Resolve instituteId from DB or fall back to single-tenant mode
    let instituteId = studentInstituteId;
    if (!instituteId) {
      try {
        instituteId = await resolvePublicInstituteId();
      } catch (resolveError) {
        console.error("[public/students] Step 2 resolvePublicInstituteId failed:", resolveError);
      }
    }

    if (!instituteId) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      return applyCorsHeaders(request, response, "GET, OPTIONS");
    }

    // Step 3: Fetch full student profile within the institute scope
    let student;
    try {
      student = await withRequestInstitute(instituteId, () => getPublicStudentProfile(id));
    } catch (profileError) {
      console.error("[public/students] Step 3 getPublicStudentProfile failed:", profileError);
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

    // Serialize dates to avoid JSON serialization issues
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
