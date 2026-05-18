import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { teacherSchema } from "@/lib/validations/teacher";
import { generateTeacherCode } from "@/lib/teacherCode";
import * as z from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "100"));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { teacherCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Note: Teacher model has no "status" field — intentionally removed to avoid empty results

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          subjects: {
            include: { subject: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teacher.count({ where }),
    ]);

    return NextResponse.json({ teachers, total, page });
  } catch (error) {
    console.error("[TEACHERS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = teacherSchema.parse(body);

    // Check email
    const existingEmail = await prisma.teacher.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const teacherCode = await generateTeacherCode();

    const teacher = await prisma.teacher.create({
      data: {
        teacherCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        qualification: data.qualification,
        specialization: data.specialization,
        experience: data.experience,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        employmentType: data.employmentType,
        salaryType: data.salaryType,
        fixedSalary: data.fixedSalary,
        perClassRate: data.perClassRate,
        perStudentRate: data.perStudentRate,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        upiId: data.upiId,
        subjects: {
          create: data.subjectIds.map((subjectId, index) => ({
            subjectId,
            isPrimary: index === 0, // First subject is primary
          })),
        },
      },
      include: {
        subjects: true,
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error) {
    console.error("[TEACHERS_POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
