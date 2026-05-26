import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { convertEnquirySchema } from "@/lib/validations/enquiry";
import { generateNextStudentCode } from "@/lib/studentCode";
import { splitPersonName } from "@/lib/enquiry";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = convertEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    if (enquiry.isConverted) {
      return NextResponse.json({ error: "Enquiry is already converted" }, { status: 409 });
    }

    const batch = await prisma.batch.findUnique({ where: { id: parsed.data.batchId } });
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const studentCode = await generateNextStudentCode();
    const studentName = splitPersonName(enquiry.studentName);
    const parentName = splitPersonName(enquiry.parentName);

    const result = await prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({
        data: {
          fatherName: parentName.firstName || enquiry.parentName,
          fatherPhone: enquiry.parentPhone,
          fatherEmail: enquiry.parentEmail || null,
          primaryContact: "FATHER",
        },
      });

      const student = await tx.student.create({
        data: {
          studentCode,
          firstName: studentName.firstName,
          lastName: studentName.lastName,
          email: enquiry.parentEmail || null,
          phone: null,
          gender: "MALE",
          academicYear: batch.academicYear,
          joiningDate: parsed.data.joiningDate,
          status: "ACTIVE",
          category: "AVERAGE",
          city: null,
          state: null,
          parentId: parent.id,
          referredBy: enquiry.referredBy || null,
          batchEnrollments: {
            create: {
              batchId: batch.id,
              enrolledBy: auth.userId,
              isActive: true,
              enrollDate: parsed.data.joiningDate,
            },
          },
          emergencyContacts: enquiry.parentPhone
            ? {
                create: [
                  {
                    name: enquiry.parentName,
                    relationship: "Parent",
                    phone: enquiry.parentPhone,
                  },
                ],
              }
            : undefined,
        },
      });

      await tx.enquiry.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          status: "CONVERTED",
          studentId: student.id,
        },
      });

      await tx.studentActivity.create({
        data: {
          studentId: student.id,
          type: "ENQUIRY_CONVERTED",
          title: "Converted from enquiry",
          description: `Converted from enquiry ${enquiry.enquiryNumber} into batch ${batch.name}.`,
          performedById: auth.userId,
        },
      });

      return { parent, student };
    });

    return NextResponse.json({ student: result.student, parent: result.parent }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
