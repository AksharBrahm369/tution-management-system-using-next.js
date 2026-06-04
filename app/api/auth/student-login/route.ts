import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { studentCode, password, rememberMe } = await request.json();

    if (!studentCode || !password) {
      return errorResponse("Student Code and Password are required", 400);
    }

    const student = await prisma.student.findUnique({
      where: { studentCode },
      include: { user: true },
    });

    if (!student) {
      return errorResponse("Invalid Student Code", 401);
    }

    if (!student.user) {
      return errorResponse("No login account exists for this student. Please contact the administrator.", 401);
    }

    if (!student.user.isActive) {
      return errorResponse("Your account has been deactivated", 403);
    }

    const isPasswordValid = await comparePassword(password, student.user.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid Student Code or password", 401);
    }

    const token = await generateToken(student.user.id, "STUDENT", student.user.email, rememberMe);

    const sessionExpiry = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        userId: student.user.id,
        token,
        expiresAt: sessionExpiry,
      },
    });

    await prisma.user.update({
      where: { id: student.user.id },
      data: { lastLogin: new Date() },
    });

    const response = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 }
    );

    setAuthCookie(response, token, rememberMe);
    return response;
  } catch (error) {
    console.error("[STUDENT_LOGIN]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
