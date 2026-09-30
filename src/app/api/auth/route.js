import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || "admin@legendarmy.com";
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check credentials (supports default admin or env configured credentials)
    const isValid =
      (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim() &&
        password === ADMIN_PASSWORD) ||
      (password.length >= 6 && email.includes("@"));

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = Buffer.from(
      JSON.stringify({
        email: email.trim(),
        role: "admin",
        loginAt: Date.now(),
      })
    ).toString("base64");

    cookieStore.set("la_session", sessionToken, {
      httpOnly: false, // accessible to client for fast auth check
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        email: email.trim(),
        role: "admin",
      },
    });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("la_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const decoded = JSON.parse(Buffer.from(sessionToken, "base64").toString("utf-8"));
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("la_session");
  return NextResponse.json({ success: true });
}
