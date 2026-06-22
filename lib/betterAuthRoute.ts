import { NextRequest, NextResponse } from "next/server";
import { splitSetCookieHeader } from "better-auth/cookies";
import { auth } from "@/lib/betterAuth";
import { prisma } from "@/lib/prisma";

export function appendAuthCookies(response: NextResponse, headers?: Headers) {
  const setCookie =
    typeof headers?.getSetCookie === "function"
      ? headers.getSetCookie()
      : splitSetCookieHeader(headers?.get("set-cookie") || "");

  for (const cookie of setCookie) {
    response.headers.append("set-cookie", cookie);
  }

  response.cookies.delete("tuitionpro_auth");
}

export async function signInWithBetterAuth(
  request: NextRequest,
  body: {
    email: string;
    password: string;
    rememberMe?: boolean;
  },
  instituteId: string
) {
  const result = await auth.api.signInEmail({
    body,
    headers: request.headers,
    returnHeaders: true,
    returnStatus: true,
  });

  const token = result.response?.token;
  if (token) {
    await prisma.session.updateMany({
      where: { token },
      data: { instituteId },
    });
  }

  return result;
}

export async function signOutWithBetterAuth(request: NextRequest) {
  return auth.api.signOut({
    headers: request.headers,
    returnHeaders: true,
    returnStatus: true,
  });
}
