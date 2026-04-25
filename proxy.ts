import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function buildCsp() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", buildCsp());
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (req.nextUrl.pathname === "/sw.js") {
    res.headers.set("Service-Worker-Allowed", "/");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
