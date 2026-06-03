import { NextRequest, NextResponse } from "next/server";
import type { BloodGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { studentUpdateSchema } from "@/lib/validations/student";
import { generateNextStudentCode } from "@/lib/studentCode";

export const runtime = "nodejs";

async function createTimeline(studentId: string, title: string, description: string, userId: string) {
  await prisma.studentActivity.create({
    data: { studentId, type: title.toUpperCase().replace(/\s+/g, "_"), title, description, performedById: userId },
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        batchEnrollments: { include: { batch: true } },
        attendance: { orderBy: { date: "desc" }, take: 100 },
        feeRecords: {
          include: {
            batch: true,
            payments: { orderBy: { paidAt: "desc" } },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
          take: 50,
        },
        examResults: { orderBy: { enteredAt: "desc" }, take: 50 },
        documents: { orderBy: { uploadedAt: "desc" } },
        emergencyContacts: true,
        medicalInfo: true,
        siblings: { include: { sibling: true } },
        siblingOf: { include: { student: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const attendanceTotal = student.attendance.length;
    const attendancePresent = student.attendance.filter((item) => item.status === "PRESENT").length;
    const feePaid = student.feeRecords.reduce((sum, record) => sum + record.paidAmount, 0);
    const feePending = student.feeRecords.reduce((sum, record) => sum + record.pendingAmount, 0);

    return NextResponse.json(
      {
        ...student,
        fullName: `${student.firstName} ${student.lastName}`,
        attendancePercent: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0,
        feesPaid: feePaid,
        pendingFees: feePending,
        currentBatch: student.batchEnrollments.find((enrollment) => enrollment.isActive)?.batch ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = studentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ where: { id }, include: { parent: true } });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const data = parsed.data;
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : null;

    // Convert bloodGroup from validation schema to Prisma enum
    const bloodGroupValue = data.bloodGroup as BloodGroup | undefined;

    if (email && email !== existing.email) {
      const duplicateEmail = await prisma.student.findFirst({
        where: { email, NOT: { id } },
        select: { id: true },
      });

      if (duplicateEmail) {
        return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
      }
    }

    if (data.studentCode && data.studentCode !== existing.studentCode) {
      const duplicate = await prisma.student.findFirst({ where: { studentCode: data.studentCode, NOT: { id } } });
      if (duplicate) {
        return NextResponse.json({ error: "Student code already exists" }, { status: 409 });
      }
    }

    await prisma.student.update({
      where: { id },
      data: {
        studentCode: data.studentCode ?? existing.studentCode ?? (await generateNextStudentCode()),
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: data.phone === "" ? null : data.phone ?? existing.phone,
        dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
        gender: data.gender ?? existing.gender,
        bloodGroup: bloodGroupValue === undefined ? existing.bloodGroup : bloodGroupValue,
        profilePhoto: data.profilePhoto === "" ? null : data.profilePhoto ?? existing.profilePhoto,
        addressLine1: data.addressLine1 === "" ? null : data.addressLine1 ?? existing.addressLine1,
        addressLine2: data.addressLine2 === "" ? null : data.addressLine2 ?? existing.addressLine2,
        city: data.city ?? existing.city,
        state: data.state ?? existing.state,
        pincode: data.pincode === "" ? null : data.pincode ?? existing.pincode,
        previousSchool: data.previousSchool === "" ? null : data.previousSchool ?? existing.previousSchool,
        previousClass: data.previousClass === "" ? null : data.previousClass ?? existing.previousClass,
        previousMarks: data.previousMarks === "" ? null : data.previousMarks ?? existing.previousMarks,
        joiningDate: data.joiningDate ?? existing.joiningDate,
        academicYear: data.academicYear ?? existing.academicYear,
        status: data.status ?? existing.status,
        category: data.category ?? existing.category,
        referredBy: data.referredBy === "" ? null : data.referredBy ?? existing.referredBy,
      },
    });

    if (
      data.fatherName !== undefined ||
      data.fatherPhone !== undefined ||
      data.motherName !== undefined ||
      data.motherPhone !== undefined ||
      data.guardianName !== undefined ||
      data.guardianPhone !== undefined ||
      data.primaryContact !== undefined
    ) {
      await prisma.parent.upsert({
        where: { id: existing.parent?.id ?? "" },
        create: {
          fatherName: data.fatherName || null,
          fatherPhone: data.fatherPhone || null,
          fatherEmail: data.fatherEmail || null,
          fatherOccup: data.fatherOccup || null,
          motherName: data.motherName || null,
          motherPhone: data.motherPhone || null,
          motherEmail: data.motherEmail || null,
          motherOccup: data.motherOccup || null,
          guardianName: data.guardianName || null,
          guardianPhone: data.guardianPhone || null,
          guardianRel: data.guardianRel || null,
          primaryContact: data.primaryContact ?? "FATHER",
          students: { connect: { id } },
        },
        update: {
          fatherName: data.fatherName ?? undefined,
          fatherPhone: data.fatherPhone ?? undefined,
          fatherEmail: data.fatherEmail ?? undefined,
          fatherOccup: data.fatherOccup ?? undefined,
          motherName: data.motherName ?? undefined,
          motherPhone: data.motherPhone ?? undefined,
          motherEmail: data.motherEmail ?? undefined,
          motherOccup: data.motherOccup ?? undefined,
          guardianName: data.guardianName ?? undefined,
          guardianPhone: data.guardianPhone ?? undefined,
          guardianRel: data.guardianRel ?? undefined,
          primaryContact: data.primaryContact ?? undefined,
        },
      });
    }

    await prisma.emergencyContact.deleteMany({ where: { studentId: id } });
    if (data.emergencyContacts?.length) {
      await prisma.emergencyContact.createMany({
        data: data.emergencyContacts.map((contact) => ({
          studentId: id,
          name: contact.name,
          relationship: contact.relationship,
          phone: contact.phone,
        })),
      });
    }

    if (data.addMedicalInfo || data.allergies || data.medications || data.conditions || data.doctorName) {
      await prisma.medicalInfo.upsert({
        where: { studentId: id },
        create: {
          studentId: id,
          allergies: data.allergies || null,
          medications: data.medications || null,
          conditions: data.conditions || null,
          doctorName: data.doctorName || null,
          doctorPhone: data.doctorPhone || null,
          insuranceInfo: data.insuranceInfo || null,
          extraNotes: data.extraNotes || null,
        },
        update: {
          allergies: data.allergies ?? undefined,
          medications: data.medications ?? undefined,
          conditions: data.conditions ?? undefined,
          doctorName: data.doctorName ?? undefined,
          doctorPhone: data.doctorPhone ?? undefined,
          insuranceInfo: data.insuranceInfo ?? undefined,
          extraNotes: data.extraNotes ?? undefined,
        },
      });
    }

    if (data.batchIds) {
      // Validate batch IDs if provided
      let validBatchIds: string[] = [];
      if (data.batchIds.length > 0) {
        const existingBatches = await prisma.batch.findMany({
          where: { id: { in: data.batchIds } },
          select: { id: true }
        });
        validBatchIds = existingBatches.map(b => b.id);
      }

      await prisma.batchEnrollment.updateMany({ where: { studentId: id }, data: { isActive: false, leaveDate: new Date() } });
      if (validBatchIds.length > 0) {
        await prisma.batchEnrollment.createMany({
          data: validBatchIds.map((batchId) => ({ studentId: id, batchId, isActive: true, enrolledBy: auth.userId })),
          skipDuplicates: true,
        });
      }
    }

    await prisma.siblingLink.deleteMany({ where: { studentId: id } });
    if (data.siblingIds?.length) {
      await prisma.siblingLink.createMany({
        data: data.siblingIds.map((siblingId) => ({ studentId: id, siblingId })),
        skipDuplicates: true,
      });
    }

    await createTimeline(id, "Student Updated", `Student profile updated by admin.`, auth.userId);

    const { logActivityFromRequest } = await import("@/lib/activityLogger");
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_EDITED",
      category: "STUDENT",
      severity: "INFO",
      description: `Student profile updated`,
      entityType: "Student",
      entityId: id,
    });

    const updated = await prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        batchEnrollments: { include: { batch: true } },
        emergencyContacts: true,
        medicalInfo: true,
        documents: true,
        siblings: { include: { sibling: true } },
        siblingOf: { include: { student: true } },
      },
    });

    return NextResponse.json({ student: updated }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;

    const existing = await prisma.student.findUnique({ where: { id }, select: { firstName: true, lastName: true, studentCode: true } });
    await prisma.student.update({ where: { id }, data: { status: "INACTIVE" } });
    await createTimeline(id, "Student Deactivated", "Student was marked inactive by admin.", auth.userId);

    const { logActivityFromRequest } = await import("@/lib/activityLogger");
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_DELETED",
      category: "STUDENT",
      severity: "WARNING",
      description: `Student deactivated: ${existing?.firstName ?? ""} ${existing?.lastName ?? ""}`,
      entityType: "Student",
      entityId: id,
      entityName: existing ? `${existing.firstName} ${existing.lastName}` : undefined,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
