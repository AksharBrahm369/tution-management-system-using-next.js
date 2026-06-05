import { NextRequest, NextResponse } from "next/server";
import { Prisma, StudentStatus, type BloodGroup } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { generateNextStudentCode } from "@/lib/studentCode";
import { studentCreateSchema } from "@/lib/validations/student";
import { logActivityFromRequest } from "@/lib/activityLogger";
import { hashPassword } from "@/lib/auth";
import { generateNextParentCode } from "@/lib/parentCode";

export const runtime = "nodejs";

function parseNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildWhere(searchParams: URLSearchParams): Prisma.StudentWhereInput {
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status") as StudentStatus | null;
  const category = searchParams.get("category");
  const batchId = searchParams.get("batchId");
  const standardId = searchParams.get("standardId");
  const academicYear = searchParams.get("academicYear");

  const where: Prisma.StudentWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { studentCode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status;
  if (category) where.category = category as Prisma.EnumStudentCategoryFilter["equals"];
  if (academicYear) where.academicYear = academicYear;
  if (batchId) {
    where.batchEnrollments = {
      some: {
        batchId,
        isActive: true,
      },
    };
  }
  if (standardId) {
    where.standardId = standardId;
  }

  return where;
}

function buildOrderBy(sortBy: string | null, sortOrder: string | null): Prisma.StudentOrderByWithRelationInput {
  const direction = sortOrder === "desc" ? "desc" : "asc";
  switch (sortBy) {
    case "studentCode":
      return { studentCode: direction };
    case "firstName":
      return { firstName: direction };
    case "lastName":
      return { lastName: direction };
    case "status":
      return { status: direction };
    case "category":
      return { category: direction };
    case "joiningDate":
      return { joiningDate: direction };
    default:
      return { createdAt: "desc" };
  }
}

async function getCurrentBatch(studentId: string) {
  const enrollment = await prisma.batchEnrollment.findFirst({
    where: { studentId, isActive: true },
    include: { batch: { include: { standard: true } } },
    orderBy: { createdAt: "desc" },
  });

  return enrollment?.batch ?? null;
}

async function buildStudentCard(student: {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  profilePhoto: string | null;
  status: StudentStatus;
  category: string;
  joiningDate: Date;
  academicYear: string;
  city: string | null;
  standard?: { id: string; name: string } | null;
  standardId?: string | null;
}) {
  const [batch, attendanceTotal, attendancePresent, latestFeeRecord] = await Promise.all([
    getCurrentBatch(student.id),
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.attendance.count({ where: { studentId: student.id, status: "PRESENT" } }),
    prisma.feeRecord.findFirst({ where: { studentId: student.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const attendancePercent = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
  const resolvedStandard = student.standard ?? batch?.standard ?? null;

  return {
    ...student,
    fullName: `${student.firstName} ${student.lastName}`,
    batch,
    standard: resolvedStandard,
    standardId: student.standardId ?? resolvedStandard?.id ?? null,
    attendancePercent,
    feeStatus: latestFeeRecord?.status ?? "UNPAID",
  };
}

async function createStudentTimeline(studentId: string, title: string, description: string, performedById: string) {
  await prisma.studentActivity.create({
    data: {
      studentId,
      type: title.toUpperCase().replace(/\s+/g, "_"),
      title,
      description,
      performedById,
    },
  });
}

function normalizeOptionalEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length > 0 ? email : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseNumber(searchParams.get("page"), 1);
    const limit = parseNumber(searchParams.get("limit"), 12);
    const where = buildWhere(searchParams);
    const orderBy = buildOrderBy(searchParams.get("sortBy"), searchParams.get("sortOrder"));

    const [students, total, totalCount, activeCount, inactiveCount, leaveCount] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          parent: true,
          standard: true,
          batchEnrollments: { include: { batch: true } },
          emergencyContacts: true,
          medicalInfo: true,
          documents: true,
          siblings: { include: { sibling: true } },
          siblingOf: { include: { student: true } },
        },
      }),
      prisma.student.count({ where }),
      prisma.student.count({ where }),
      prisma.student.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.student.count({ where: { ...where, status: "INACTIVE" } }),
      prisma.student.count({ where: { ...where, status: "ON_LEAVE" } }),
    ]);

    const studentsWithExtras = await Promise.all(students.map((student) => buildStudentCard(student)));

    return NextResponse.json(
      {
        students: studentsWithExtras,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats: {
          total: totalCount,
          active: activeCount,
          inactive: inactiveCount,
          onLeave: leaveCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json();
    console.log("POST /api/admin/students - Raw Body:", body);
    const parsed = studentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    console.log("POST /api/admin/students - Parsed Data:", data);
    const email = normalizeOptionalEmail(data.email);

    if (email) {
      const duplicateEmail = await prisma.student.findFirst({
        where: { email },
        select: { id: true },
      });

      if (duplicateEmail) {
        return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
      }
    }

    // Validate batch IDs if provided
    let validBatchIds: string[] = [];
    let inferredStandardId = data.standardId || null;
    if (data.batchIds && data.batchIds.length > 0) {
      const existingBatches = await prisma.batch.findMany({
        where: { id: { in: data.batchIds } },
        select: { id: true, standardId: true }
      });
      validBatchIds = existingBatches.map(b => b.id);
      const batchStandardIds = [...new Set(existingBatches.map((batch) => batch.standardId).filter((value): value is string => Boolean(value)))];
      if (batchStandardIds.length > 1) {
        return NextResponse.json({ error: "Selected batches belong to multiple standards. Please select batches from only one standard." }, { status: 400 });
      }
      if (data.standardId && batchStandardIds[0] && data.standardId !== batchStandardIds[0]) {
        return NextResponse.json({ error: "Student standard does not match the selected batch standard." }, { status: 400 });
      }
      inferredStandardId = inferredStandardId ?? batchStandardIds[0] ?? null;
    }

    // Always allocate a fresh server-side code for new students.
    // The client displays a preview code, but it can become stale if another
    // student is created before submit completes.
    const studentCode = await generateNextStudentCode();
    const parentCode = await generateNextParentCode();

    const parent = await prisma.parent.create({
      data: {
        parentCode,
        fatherName: data.fatherName || null,
        fatherPhone: data.fatherPhone,
        fatherEmail: data.fatherEmail || null,
        fatherOccup: data.fatherOccup || null,
        motherName: data.motherName || null,
        motherPhone: data.motherPhone || null,
        motherEmail: data.motherEmail || null,
        motherOccup: data.motherOccup || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        guardianRel: data.guardianRel || null,
        primaryContact: data.primaryContact,
      },
    });

    const student = await prisma.student.create({
      data: {
        studentCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender,
        bloodGroup: (data.bloodGroup as BloodGroup | undefined) ?? null,
        profilePhoto: data.profilePhoto || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode || null,
        previousSchool: data.previousSchool || null,
        previousClass: data.previousClass || null,
        previousMarks: data.previousMarks || null,
        joiningDate: data.joiningDate,
        academicYear: data.academicYear,
        standardId: inferredStandardId,
        status: data.status ?? "ACTIVE",
        category: data.category,
        referredBy: data.referredBy || null,
        parentId: parent.id,
        notifications: undefined,
        batchEnrollments: validBatchIds.length > 0
          ? {
              create: validBatchIds.map((batchId) => ({
                batchId,
                enrolledBy: auth?.userId ?? "admin",
                isActive: true,
              })),
            }
          : undefined,
        emergencyContacts: {
          create: data.emergencyContacts.map((contact) => ({
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
          })),
        },
        medicalInfo:
          data.addMedicalInfo || data.allergies || data.medications || data.conditions || data.doctorName
            ? {
                create: {
                  allergies: data.allergies || null,
                  medications: data.medications || null,
                  conditions: data.conditions || null,
                  doctorName: data.doctorName || null,
                  doctorPhone: data.doctorPhone || null,
                  insuranceInfo: data.insuranceInfo || null,
                  extraNotes: data.extraNotes || null,
                },
              }
            : undefined,
      },
      include: {
        parent: true,
        batchEnrollments: { include: { batch: true } },
        emergencyContacts: true,
        medicalInfo: true,
      },
    });

    if (data.siblingIds?.length) {
      await prisma.siblingLink.createMany({
        data: data.siblingIds.map((siblingId) => ({ studentId: student.id, siblingId })),
        skipDuplicates: true,
      });
    }

    await createStudentTimeline(
      student.id,
      "Student Added",
      `${student.firstName} ${student.lastName} was created by admin.`,
      auth.userId
    );

    if (data.createStudentLogin) {
      const hashedPassword = await hashPassword("temporary-student-login");
      const studentUser = await prisma.user.create({
        data: {
          name: `${student.firstName} ${student.lastName}`,
          email: `${studentCode}@tuitionpro.local`,
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      });

      await prisma.student.update({ where: { id: student.id }, data: { userId: studentUser.id } });
    }

    // Create Parent User automatically if requested
    if (data.createParentLogin) {
      const hashedPassword = await hashPassword("temporary-parent-login");
      const parentUser = await prisma.user.create({
        data: {
          name: parent.fatherName || parent.motherName || parent.guardianName || `Parent of ${student.firstName}`,
          email: `${parentCode}@tuitionpro.local`,
          password: hashedPassword,
          role: "PARENT",
          isActive: true,
        },
      });
      await prisma.parent.update({ where: { id: parent.id }, data: { userId: parentUser.id } });
    }

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_ADDED",
      category: "STUDENT",
      severity: "INFO",
      description: `Student ${student.firstName} ${student.lastName} (${student.studentCode}) added`,
      entityType: "Student",
      entityId: student.id,
      entityName: `${student.firstName} ${student.lastName}`,
      newValue: { studentCode: student.studentCode, status: student.status },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "unique field";
      const message = target.includes("email")
        ? "A student with this email already exists"
        : `Duplicate value found for ${target}`;
      return NextResponse.json({ error: message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
