import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teacherSchema } from "@/lib/validations/teacher";
import * as z from "zod";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: {
          include: { subject: true }
        },
        batches: {
          include: { subject: true }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = teacherSchema.parse(body);

    // Check email isn't taken by another teacher
    const existingEmail = await prisma.teacher.findFirst({
      where: { email: data.email, id: { not: id } },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already taken by another teacher" }, { status: 400 });
    }

    // Update teacher details
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        qualification: data.qualification || null,
        specialization: data.specialization || null,
        experience: data.experience ?? null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        employmentType: data.employmentType,
        salaryType: data.salaryType,
        fixedSalary: data.fixedSalary || null,
        perClassRate: data.perClassRate || null,
        perStudentRate: data.perStudentRate || null,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        upiId: data.upiId || null,
        // Update subjects - disconnect all first, then connect/create
        subjects: {
          deleteMany: {},
          create: data.subjectIds.map((subjectId: string, index: number) => ({
            subjectId,
            isPrimary: index === 0,
          }))
        },
        standardSubjects: data.standardId
          ? {
              deleteMany: { standardId: data.standardId },
              create: data.subjectIds.map((subjectId: string) => ({
                standardId: data.standardId!,
                subjectId,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_PUT]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
