// File reloaded to clear Turbopack cache
import { NextRequest, NextResponse } from "next/server";
import { Prisma, type BloodGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { studentUpdateSchema } from "@/lib/validations/student";
import { generateNextStudentCode } from "@/lib/studentCode";
import { hashPassword } from "@/lib/auth";
import { upsertCredentialAccount } from "@/lib/betterAuthAccounts";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { generateNextParentCode } from "@/lib/parentCode";
import { inferStandardIdFromBatchIds } from "@/lib/standardAssignments";

export const runtime = "nodejs";

async function createTimeline(studentId: string, title: string, description: string, userId: string) {
  await prisma.studentActivity.create({
    data: { studentId, type: title.toUpperCase().replace(/\s+/g, "_"), title, description, performedById: userId },
  });
}

function normalizeOptionalEmail(value: unknown) {
  if (typeof value !== "string") return undefined;
  const email = value.trim().toLowerCase();
  return email.length > 0 ? email : null;
}

function getDuplicateStudentMessage(error: Prisma.PrismaClientKnownRequestError): string {
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : String(error.meta?.target ?? "");

  if (target.includes("studentCode")) return "Student code already exists. Please use a different code.";
  if (target.includes("parentCode")) return "Parent code already exists. Please try saving again.";
  if (target.includes("email")) return "This email is already in use. Please use a different email.";
  if (target.includes("userId")) return "This login is already linked to another profile.";
  if (target.includes("studentId") && target.includes("batchId")) return "This student is already enrolled in one of the selected batches.";

  return "A duplicate value already exists. Please review the form and try again.";
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;

    const student = await prisma.student.findUnique({
      where: { id, instituteId: auth.instituteId },
      include: {
        parent: true,
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
        standard: true,
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
        examResults: {
          include: {
            exam: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: { enteredAt: "desc" },
          take: 50,
        },
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

    const studentAssignments = await prisma.examResult.findMany({
      where: {
        studentId: id,
        exam: {
          type: "ASSIGNMENT",
        },
      },
      select: {
        status: true,
      },
    });

    const assignmentsTotal = studentAssignments.length;
    const assignmentsSubmitted = studentAssignments.filter((r) => r.status !== "PENDING").length;

    const mappedExamResults = student.examResults.map((result) => {
      const examName = result.exam?.title || "Exam";
      const subject = result.exam?.subject?.name || "Unknown";
      const score = result.marksObtained || 0;
      const totalMarks = result.totalMarks || result.exam?.totalMarks || 100;
      const percentage = result.percentage || (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0);

      return {
        id: result.id,
        examName,
        subject,
        score,
        totalMarks,
        percentage,
        examDate: result.exam?.examDate || new Date().toISOString(),
      };
    });

    return NextResponse.json(
      {
        ...student,
        examResults: mappedExamResults,
        fullName: `${student.firstName} ${student.lastName}`,
        attendancePercent: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0,
        feesPaid: feePaid,
        pendingFees: feePending,
        currentBatch: student.batchEnrollments.find((enrollment) => enrollment.isActive)?.batch ?? null,
        assignmentsSubmitted,
        assignmentsTotal,
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

    // Scope to current institute
    const existing = await prisma.student.findUnique({ where: { id, instituteId: auth.instituteId }, include: { parent: true } });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const data = parsed.data;
    const email = normalizeOptionalEmail(data.email);

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

    let inferredStandardId = data.standardId === "" ? null : data.standardId ?? existing.standardId;
    if (data.batchIds !== undefined && data.batchIds.length > 0) {
      const batchStandardId = await inferStandardIdFromBatchIds(prisma, data.batchIds);
      if (data.standardId && data.standardId !== "" && batchStandardId && data.standardId !== batchStandardId) {
        return NextResponse.json({ error: "Student standard does not match the selected batch standard." }, { status: 400 });
      }
      inferredStandardId = batchStandardId ?? inferredStandardId;
    }

    await prisma.student.update({
      where: { id },
      data: {
        studentCode: data.studentCode ?? existing.studentCode ?? (await generateNextStudentCode()),
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName ?? existing.lastName,
        email: email === undefined ? existing.email : email,
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
        standardId: inferredStandardId,
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
      const parentCode = existing.parent?.parentCode ?? (await generateNextParentCode());

      await prisma.parent.upsert({
        where: { id: existing.parent?.id ?? "" },
        create: {
          instituteId: auth.instituteId,
          parentCode,
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

    if (data.batchIds !== undefined && data.batchIds.length > 0) {
      let validBatchIds: string[] = [];
      if (data.batchIds.length > 0) {
        const existingBatches = await prisma.batch.findMany({
          where: { id: { in: data.batchIds } },
          select: { id: true },
        });
        validBatchIds = existingBatches.map((batch) => batch.id);
      }

      const desiredBatchIds = new Set(validBatchIds);
      const currentEnrollments = await prisma.batchEnrollment.findMany({
        where: { studentId: id },
        select: { id: true, batchId: true, isActive: true },
      });

      const currentByBatchId = new Map(currentEnrollments.map((enrollment) => [enrollment.batchId, enrollment]));
      const enrollmentsToDeactivate = currentEnrollments
        .filter((enrollment) => enrollment.isActive && !desiredBatchIds.has(enrollment.batchId))
        .map((enrollment) => enrollment.id);

      const updates = [];

      if (enrollmentsToDeactivate.length > 0) {
        updates.push(
          prisma.batchEnrollment.updateMany({
            where: { id: { in: enrollmentsToDeactivate } },
            data: { isActive: false, leaveDate: new Date() },
          })
        );
      }

      for (const batchId of validBatchIds) {
        const existingEnrollment = currentByBatchId.get(batchId);
        if (existingEnrollment) {
          updates.push(
            prisma.batchEnrollment.update({
              where: { id: existingEnrollment.id },
              data: { isActive: true, leaveDate: null },
            })
          );
        } else {
          updates.push(
            prisma.batchEnrollment.create({
              data: { studentId: id, batchId, isActive: true, enrolledBy: auth.userId },
            })
          );
        }
      }

      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }
    }

    await prisma.siblingLink.deleteMany({ where: { studentId: id } });
    if (data.siblingIds?.length) {
      await prisma.siblingLink.createMany({
        data: data.siblingIds.map((siblingId) => ({ studentId: id, siblingId })),
        skipDuplicates: true,
      });
    }

    if (data.createStudentLogin && !existing.userId) {
      const hashedPassword = await hashPassword("temporary-student-login");
      const studentUser = await prisma.user.create({
        data: {
          name: `${data.firstName ?? existing.firstName} ${data.lastName ?? existing.lastName}`,
          email: `${data.studentCode ?? existing.studentCode}@tuitionpro.local`,
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      });

      await upsertCredentialAccount(studentUser.id, hashedPassword);
      await prisma.student.update({ where: { id }, data: { userId: studentUser.id } });
    }

    if (data.createParentLogin && existing.parent && !existing.parent.userId) {
      const hashedPassword = await hashPassword("temporary-parent-login");
      const parentUser = await prisma.user.create({
        data: {
          name: data.fatherName || data.motherName || data.guardianName || existing.parent.fatherName || existing.parent.motherName || existing.parent.guardianName || `Parent of ${existing.firstName}`,
          email: `${existing.parent.parentCode}@tuitionpro.local`,
          password: hashedPassword,
          role: "PARENT",
          isActive: true,
        },
      });

      await upsertCredentialAccount(parentUser.id, hashedPassword);
      await prisma.parent.update({ where: { id: existing.parent.id }, data: { userId: parentUser.id } });
    }

    await createTimeline(id, "Student Updated", `Student profile updated by admin.`, auth.userId);

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
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
        standard: true,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: getDuplicateStudentMessage(error) }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSuperAdmin(request);
    const { id } = await context.params;

    // Scope to current institute to prevent cross-institute deletion
    const existing = await prisma.student.findUnique({
      where: { id, instituteId: auth.instituteId },
      select: { firstName: true, lastName: true, studentCode: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.student.update({ where: { id }, data: { status: "INACTIVE" } });
    await createTimeline(id, "Student Deactivated", "Student was marked inactive by admin.", auth.userId);

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_DELETED",
      category: "STUDENT",
      severity: "WARNING",
      description: `Student deactivated: ${existing.firstName} ${existing.lastName}`,
      entityType: "Student",
      entityId: id,
      entityName: `${existing.firstName} ${existing.lastName}`,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
