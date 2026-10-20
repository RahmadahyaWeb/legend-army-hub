import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  let sessionCookie = request.cookies.get("la_session")?.value;

  if (!sessionCookie) {
    const rawCookie = request.headers.get("cookie") || "";
    const match = rawCookie.match(/(?:^|;\s*)la_session=([^;]+)/);
    if (match) {
      sessionCookie = match[1];
    }
  }

  let isAuthenticated = false;
  if (sessionCookie) {
    try {
      const decodedStr = Buffer.from(decodeURIComponent(sessionCookie), "base64").toString("utf-8");
      const decoded = JSON.parse(decodedStr);
      if (decoded && (decoded.email || decoded.role === "admin" || decoded.displayName || decoded.id)) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. If accessing /login while already authenticated -> redirect to /admin
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 2. If accessing /admin or /admin/* while unauthenticated -> redirect to /login
  if (pathname.startsWith("/admin") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
