import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureCredentialAccount } from "@/lib/betterAuthAccounts";
import { appendAuthCookies, signInWithBetterAuth } from "@/lib/betterAuthRoute";
import { errorResponse } from "@/lib/utils";
import { setRequestInstitute, withoutAuthScope } from "@/lib/institute";

export async function POST(request: NextRequest) {
  return withoutAuthScope(async () => {
    try {
      const { parentCode, password, rememberMe } = await request.json();

      if (!parentCode || !password) {
        return errorResponse("Parent Code and Password are required", 400);
      }

      const parent = await prisma.parent.findFirst({
        where: { parentCode },
        include: { user: true },
      });

      if (!parent || !parent.user) {
        return errorResponse("Invalid Parent Code or password", 401);
      }

      const instituteId = parent.user.instituteId ?? parent.instituteId;
      if (!instituteId) {
        return errorResponse(
          "This parent account is not linked to a tuition. Please contact the administrator.",
          403
        );
      }

      if (!parent.user.isActive) {
        return errorResponse("Your account has been deactivated", 403);
      }

      if (!parent.user.instituteId) {
        await prisma.user.update({
          where: { id: parent.user.id },
          data: { instituteId },
        });
      }

      await ensureCredentialAccount(parent.user.id, parent.user.password);
      setRequestInstitute(instituteId);

      let signInResult: Awaited<ReturnType<typeof signInWithBetterAuth>>;
      try {
        signInResult = await signInWithBetterAuth(
          request,
          {
            email: parent.user.email,
            password,
            rememberMe: rememberMe ?? false,
          },
          instituteId
        );
      } catch {
        return errorResponse("Invalid Parent Code or password", 401);
      }

      await prisma.user.update({
        where: { id: parent.user.id },
        data: { lastLogin: new Date(), instituteId },
      });

      const response = NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 }
      );

      appendAuthCookies(response, signInResult.headers);
      return response;
    } catch (error) {
      console.error("[PARENT_LOGIN]", error);
      return errorResponse("Something went wrong. Please try again", 500);
    }
  });
}
