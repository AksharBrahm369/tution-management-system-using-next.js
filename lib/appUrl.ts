import { NextRequest } from "next/server";

function normalizeUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getAppUrl(request?: NextRequest) {
  const requestOrigin = request?.nextUrl?.origin;
  if (requestOrigin && !requestOrigin.includes("localhost")) {
    return normalizeUrl(requestOrigin);
  }

  const forwardedProto = request?.headers.get("x-forwarded-proto");
  const forwardedHost = request?.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return normalizeUrl(`${forwardedProto}://${forwardedHost}`);
  }

  const explicitAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (explicitAppUrl && !explicitAppUrl.includes("localhost")) {
    return normalizeUrl(explicitAppUrl);
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    const normalizedHost = vercelUrl.replace(/^https?:\/\//, "");
    return normalizeUrl(`https://${normalizedHost}`);
  }

  if (requestOrigin) {
    return normalizeUrl(requestOrigin);
  }

  return "http://localhost:3000";
}
