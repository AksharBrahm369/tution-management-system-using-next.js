import { NextRequest, NextResponse } from "next/server";
import { enquiryCreateSchema } from "@/lib/validations/enquiry";
import { generateEnquiryNumber, notifySuperAdmins, sendEnquiryWhatsAppAcknowledgement } from "@/lib/enquiry";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = enquiryCreateSchema.safeParse({
      ...body,
      source: "WEBSITE",
    });

    if (!parsed.success) {
      const response = NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
      response.headers.set("Access-Control-Allow-Origin", "*");
      return response;
    }

    const data = parsed.data;
    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNumber: generateEnquiryNumber(),
        studentName: data.studentName.trim(),
        studentAge: data.studentAge ?? null,
        studentClass: data.studentClass || null,
        parentName: data.parentName.trim(),
        parentPhone: data.parentPhone.trim(),
        parentEmail: data.parentEmail || null,
        address: data.address || null,
        interestedIn: data.interestedIn,
        preferredBatch: data.preferredBatch || null,
        preferredTime: data.preferredTime || null,
        source: "WEBSITE",
        sourceDetail: data.sourceDetail || null,
        referredBy: data.referredBy || null,
        status: "NEW",
        priority: data.priority ?? "NORMAL",
        assignedTo: null,
        assignedAt: null,
        notes: data.notes || null,
      },
    });

    await sendEnquiryWhatsAppAcknowledgement(data.parentName.trim(), data.parentPhone.trim());
    await notifySuperAdmins("New website enquiry", `${data.studentName} submitted the public enquiry form.`, "/admin/enquiries");

    const response = NextResponse.json({ enquiry, message: "Thank you for your enquiry. We will contact you within 24 hours." }, { status: 201 });
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

