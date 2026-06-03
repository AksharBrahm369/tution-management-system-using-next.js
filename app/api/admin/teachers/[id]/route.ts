import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    // Quick validation checks could be added here, but relying on Zod schema in component is also fine
    const {
      firstName, lastName, email, phone, gender, employmentType, salaryType,
      fixedSalary, perClassRate, subjectIds
    } = body;

    // Check email isn't taken by another teacher
    const existingEmail = await prisma.teacher.findFirst({
      where: { email, id: { not: id } },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already taken by another teacher" }, { status: 400 });
    }

    // Update teacher details
    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        gender,
        employmentType,
        salaryType,
        fixedSalary: fixedSalary || null,
        perClassRate: perClassRate || null,
        // Update subjects - disconnect all first, then connect/create
        subjects: {
          deleteMany: {},
          create: subjectIds.map((subjectId: string, index: number) => ({
            subjectId,
            isPrimary: index === 0,
          }))
        }
      }
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("[TEACHER_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
