import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { listParents } from "@/lib/parentManagement";
import { generateNextParentCode } from "@/lib/parentCode";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const params = request.nextUrl.searchParams;
    const parents = await listParents({
      search: params.get("search") ?? undefined,
      batchId: params.get("batchId") ?? undefined,
      loginStatus: (params.get("loginStatus") ?? "ALL") as "ALL" | "ACTIVE" | "NO_LOGIN",
    });
    return NextResponse.json({ parents });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const fatherName = typeof body.fatherName === "string" ? body.fatherName.trim() : "";
    const motherName = typeof body.motherName === "string" ? body.motherName.trim() : "";
    const guardianName = typeof body.guardianName === "string" ? body.guardianName.trim() : "";

    if (!fatherName && !motherName && !guardianName) {
      return NextResponse.json({ error: "Enter at least one parent or guardian name" }, { status: 400 });
    }

    const parentCode = await generateNextParentCode();

    const parent = await prisma.parent.create({
      data: {
        parentCode,
        fatherName: fatherName || null,
        fatherPhone: typeof body.fatherPhone === "string" && body.fatherPhone.trim() ? body.fatherPhone.trim() : null,
        fatherEmail: typeof body.fatherEmail === "string" && body.fatherEmail.trim() ? body.fatherEmail.trim() : null,
        fatherOccup: typeof body.fatherOccup === "string" && body.fatherOccup.trim() ? body.fatherOccup.trim() : null,
        motherName: motherName || null,
        motherPhone: typeof body.motherPhone === "string" && body.motherPhone.trim() ? body.motherPhone.trim() : null,
        motherEmail: typeof body.motherEmail === "string" && body.motherEmail.trim() ? body.motherEmail.trim() : null,
        motherOccup: typeof body.motherOccup === "string" && body.motherOccup.trim() ? body.motherOccup.trim() : null,
        guardianName: guardianName || null,
        guardianPhone: typeof body.guardianPhone === "string" && body.guardianPhone.trim() ? body.guardianPhone.trim() : null,
        guardianRel: typeof body.guardianRel === "string" && body.guardianRel.trim() ? body.guardianRel.trim() : null,
        primaryContact: typeof body.primaryContact === "string" && body.primaryContact.trim() ? body.primaryContact.trim().toUpperCase() : "FATHER",
      },
    });

    return NextResponse.json({ parent }, { status: 201 });
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
