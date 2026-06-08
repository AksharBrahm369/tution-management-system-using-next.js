import { NextRequest, NextResponse } from "next/server";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    if (!id) {
      const response = NextResponse.json({ error: "Missing student ID" }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const student = await getPublicStudentProfile(id);
    if (!student) {
      const response = NextResponse.json({ error: "Student not found" }, { status: 404 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }
    const response = NextResponse.json(student, { status: 200 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const response = NextResponse.json({ error: message }, { status: 500 });
    response.headers.set("Access-Control-Allow-Origin", "*");
    return response;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

