import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireAdmin, getRouteErrorStatus } from "@/lib/roleAuth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { upsertCredentialAccount } from "@/lib/betterAuthAccounts";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.userId || student.user) {
      return NextResponse.json(
        { error: "Student login already exists", email: student.user?.email ?? null },
        { status: 409 }
      );
    }

    const preferredEmail = student.email?.trim().toLowerCase() || null;
    const fallbackEmail = `${student.studentCode.toLowerCase()}@tuitionpro.local`;
    const emailInUse = preferredEmail
      ? await prisma.user.findUnique({
          where: { email: preferredEmail },
          select: { id: true },
        })
      : null;
    const email = !preferredEmail || emailInUse ? fallbackEmail : preferredEmail;
    const password = `Student@${randomUUID().slice(0, 8)}`;
    const hashed = await hashPassword(password);
    const fullName = `${student.firstName} ${student.lastName}`.trim();

    const user = await prisma.user.create({
      data: {
        email,
        name: fullName || student.studentCode,
        password: hashed,
        role: "STUDENT",
        isActive: true,
        isVerified: true,
      },
    });

    await upsertCredentialAccount(user.id, hashed);

    await prisma.student.update({
      where: { id },
      data: { userId: user.id },
    });

    const { logActivityFromRequest } = await import("@/lib/activityLogger");
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "STUDENT_LOGIN_CREATED",
      category: "USER_MANAGEMENT",
      severity: "WARNING",
      description: `Student portal login created for ${fullName || student.studentCode}`,
      entityType: "Student",
      entityId: student.id,
      entityName: fullName || student.studentCode,
      metadata: { accountUserId: user.id, email },
    });

    return NextResponse.json(
      {
        message: "Student login account created",
        email,
        password,
      },
      { status: 200 }
    );
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(request);
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.userId || !student.user) {
      return NextResponse.json({ error: "Student login does not exist yet" }, { status: 404 });
    }

    const password = `Student@${randomUUID().slice(0, 8)}`;
    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.user.id },
        data: {
          password: hashed,
          isActive: true,
          isVerified: true,
        },
      }),
      prisma.session.deleteMany({
        where: { userId: student.user.id },
      }),
    ]);

    await upsertCredentialAccount(student.user.id, hashed);

    const fullName = `${student.firstName} ${student.lastName}`.trim() || student.studentCode;
    const { logActivityFromRequest } = await import("@/lib/activityLogger");
    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "ADMIN_PASSWORD_RESET",
      category: "USER_MANAGEMENT",
      severity: "WARNING",
      description: `Student portal password reset for ${fullName}`,
      entityType: "Student",
      entityId: student.id,
      entityName: fullName,
      metadata: { accountUserId: student.user.id, email: student.user.email },
    });

    return NextResponse.json(
      {
        message: "Student password reset successfully",
        email: student.user.email,
        password,
      },
      { status: 200 }
    );
  } catch (error) {
    const { message, status } = getRouteErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
