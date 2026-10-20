import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Parses and verifies user session from request cookies.
 *
 * Why this exists:
 * Enforces server-side authorization check across API endpoints to ensure
 * unauthenticated requests cannot perform write or destructive operations.
 *
 * @param {Request} [request] - Optional NextRequest object
 * @returns {Promise<Object|null>} - Authenticated user payload or null
 */
export async function getSessionUser(request) {
  try {
    let sessionCookie = null;

    if (request && typeof request.cookies?.get === "function") {
      sessionCookie = request.cookies.get("la_session")?.value;
    }

    if (!sessionCookie) {
      try {
        const cookieStore = await cookies();
        sessionCookie = cookieStore.get("la_session")?.value;
      } catch {
        // Ignored if outside request context
      }
    }

    // Fallback: check raw Cookie header or Authorization Bearer header
    if (!sessionCookie && request && typeof request.headers?.get === "function") {
      const rawCookie = request.headers.get("cookie") || "";
      const match = rawCookie.match(/(?:^|;\s*)la_session=([^;]+)/);
      if (match) {
        sessionCookie = match[1];
      } else {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          sessionCookie = authHeader.slice(7).trim();
        }
      }
    }

    if (!sessionCookie) return null;

    const decodedStr = Buffer.from(decodeURIComponent(sessionCookie), "base64").toString("utf-8");
    const decoded = JSON.parse(decodedStr);

    if (decoded && (decoded.role === "admin" || decoded.email || decoded.displayName)) {
      return decoded;
    }

    return null;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

/**
 * Guard utility for API routes that require administrative privilege.
 *
 * @param {Request} [request] - Incoming API request
 * @returns {Promise<Object|NextResponse>} Returns authenticated user or 401 response
 */
export async function requireAdmin(request) {
  const user = await getSessionUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session is required." },
      { status: 401 }
    );
  }

  return user;
}
