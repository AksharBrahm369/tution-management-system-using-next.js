import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCredentialAccount } from "@/lib/betterAuthAccounts";
import { appendAuthCookies, signInWithBetterAuth } from "@/lib/betterAuthRoute";
import { errorResponse } from "@/lib/utils";
import { setRequestInstitute, withoutAuthScope } from "@/lib/institute";

function normalizeStudentCode(value: string): string {
  return value
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, "")
    .toUpperCase();
}

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
    try {
      const { studentCode, password, rememberMe } = await request.json();

      if (!studentCode || !password) {
        return errorResponse("Student Code and Password are required", 400);
      }

      const normalizedStudentCode = normalizeStudentCode(String(studentCode));

      const student = await prisma.student.findFirst({
        where: {
          studentCode: {
            equals: normalizedStudentCode,
            mode: "insensitive",
          },
        },
        include: { user: true },
      });

      if (!student) {
        return errorResponse("Invalid Student Code", 401);
      }

      if (!student.user) {
        return errorResponse(
          "No login account exists for this student. Please contact the administrator.",
          401
        );
      }

      const instituteId = student.user.instituteId ?? student.instituteId;
      if (!instituteId) {
        return errorResponse(
          "This student account is not linked to a tuition. Please contact the administrator.",
          403
        );
      }

      if (!student.user.isActive) {
        return errorResponse("Your account has been deactivated", 403);
      }

      if (!student.user.instituteId) {
        await prisma.user.update({
          where: { id: student.user.id },
          data: { instituteId },
        });
      }

      await ensureCredentialAccount(student.user.id, student.user.password);
      setRequestInstitute(instituteId);

      let signInResult: Awaited<ReturnType<typeof signInWithBetterAuth>>;
      try {
        signInResult = await signInWithBetterAuth(
          request,
          {
            email: student.user.email,
            password,
            rememberMe: rememberMe ?? false,
          },
          instituteId
        );
      } catch {
        return errorResponse("Invalid Student Code or password", 401);
      }

      await prisma.user.update({
        where: { id: student.user.id },
        data: { lastLogin: new Date(), instituteId },
      });

      const response = NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 }
      );

      appendAuthCookies(response, signInResult.headers);
      return response;
    } catch (error) {
      console.error("[STUDENT_LOGIN]", error);
      return errorResponse("Something went wrong. Please try again", 500);
    }
  });
}
