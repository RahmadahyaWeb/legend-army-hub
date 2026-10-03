import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("la_session")?.value;

  let isAuthenticated = false;
  if (sessionCookie) {
    try {
      const decoded = JSON.parse(
        Buffer.from(sessionCookie, "base64").toString("utf-8")
      );
      if (decoded && (decoded.email || decoded.role === "admin")) {
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
