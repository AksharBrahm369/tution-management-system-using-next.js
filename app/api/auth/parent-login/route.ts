import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, generateToken, setAuthCookie } from "@/lib/auth";
import { errorResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { parentCode, password, rememberMe } = await request.json();

    if (!parentCode || !password) {
      return errorResponse("Parent Code and Password are required", 400);
    }

    const parent = await prisma.parent.findUnique({
      where: { parentCode },
      include: { user: true },
    });

    if (!parent || !parent.user) {
      return errorResponse("Invalid Parent Code or password", 401);
    }

    if (!parent.user.isActive) {
      return errorResponse("Your account has been deactivated", 403);
    }

    const isPasswordValid = await comparePassword(password, parent.user.password);
    if (!isPasswordValid) {
      return errorResponse("Invalid Parent Code or password", 401);
    }

    const token = await generateToken(parent.user.id, "PARENT", parent.user.email, rememberMe);

    const sessionExpiry = new Date(
      Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
    );

    await prisma.session.create({
      data: {
        userId: parent.user.id,
        token,
        expiresAt: sessionExpiry,
      },
    });

    await prisma.user.update({
      where: { id: parent.user.id },
      data: { lastLogin: new Date() },
    });

    const response = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 }
    );

    setAuthCookie(response, token, rememberMe);
    return response;
  } catch (error) {
    console.error("[PARENT_LOGIN]", error);
    return errorResponse("Something went wrong. Please try again", 500);
  }
}
