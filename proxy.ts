/**
 * TuitionPro - Next.js 16 Proxy
 *
 * Protects role-based dashboard routes, redirects authenticated users away
 * from matching auth pages, and applies security headers.
 */

import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/betterAuth";

const PROTECTED_ROUTE_PREFIXES = [
  "/admin",
  "/teacher",
  "/student",
  "/parent",
];

const AUTH_ROUTE_PREFIXES = [
  "/auth/login",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/student/login",
  "/parent/login",
];

const ROLE_ROUTE_MAP: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  SUPER_ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
};

type SessionUser = {
  userId: string;
  instituteId: string;
  role: Role;
  email: string;
};

async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: { disableCookieCache: true },
    });

    if (!session?.user?.id) return null;

    const user = session.user as typeof session.user & {
      instituteId?: string | null;
      role?: Role;
    };

    if (!user.instituteId || !user.role || !user.email) return null;

    return {
      userId: user.id,
      instituteId: user.instituteId,
      role: user.role,
      email: user.email,
    };
  } catch {
    return null;
  }
}

function isProtectedRoute(pathname: string): boolean {
  if (isAuthRoute(pathname)) return false;
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasRoleAccess(role: Role, pathname: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  return pathname.startsWith(ROLE_ROUTE_MAP[role]);
}

function loginPathFor(pathname: string) {
  if (pathname.startsWith("/student")) return "/student/login";
  if (pathname.startsWith("/parent")) return "/parent/login";
  return "/auth/login";
}

function withSecurityHeaders(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    response.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, max-age=0, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Enforce CORS origin constraints - restrict to approved origins, never wildcard in production
  const origin = request.headers.get("origin");
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const allowedOrigins = new Set([
    "https://tution-management-system-using-next-nine.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    envUrl,
    vercelUrl,
  ].filter(Boolean) as string[]);

  if (origin && allowedOrigins.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  } else {
    // Strip wildcard or unauthorized origin header to prevent security issues in production
    const currentOrigin = response.headers.get("Access-Control-Allow-Origin");
    if (currentOrigin === "*" || (currentOrigin && !allowedOrigins.has(currentOrigin))) {
      response.headers.delete("Access-Control-Allow-Origin");
      response.headers.delete("Access-Control-Allow-Credentials");
    }
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle preflight OPTIONS requests directly
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return withSecurityHeaders(request, response, pathname);
  }

  const protectedRoute = isProtectedRoute(pathname);
  const authRoute = isAuthRoute(pathname);
  const sessionUser = protectedRoute || authRoute ? await getSessionUser(request) : null;

  if (protectedRoute) {
    if (!sessionUser) {
      const loginUrl = new URL(loginPathFor(pathname), request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return withSecurityHeaders(request, NextResponse.redirect(loginUrl), pathname);
    }

    if (!hasRoleAccess(sessionUser.role, pathname)) {
      return withSecurityHeaders(
        request,
        NextResponse.redirect(
          new URL(ROLE_DASHBOARD_MAP[sessionUser.role], request.url)
        ),
        pathname
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", sessionUser.userId);
    requestHeaders.set("x-institute-id", sessionUser.instituteId);
    requestHeaders.set("x-user-role", sessionUser.role);
    requestHeaders.set("x-user-email", sessionUser.email);
    requestHeaders.set("x-pathname", pathname + request.nextUrl.search);

    return withSecurityHeaders(
      request,
      NextResponse.next({ request: { headers: requestHeaders } }),
      pathname
    );
  }

  if (authRoute && sessionUser) {
    const matchesAuthRoute =
      pathname.startsWith("/student/login")
        ? sessionUser.role === "STUDENT"
        : pathname.startsWith("/parent/login")
          ? sessionUser.role === "PARENT"
          : sessionUser.role === "SUPER_ADMIN" || sessionUser.role === "TEACHER";

    if (matchesAuthRoute) {
      return withSecurityHeaders(
        request,
        NextResponse.redirect(
          new URL(ROLE_DASHBOARD_MAP[sessionUser.role], request.url)
        ),
        pathname
      );
    }
  }

  return withSecurityHeaders(request, NextResponse.next(), pathname);
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
