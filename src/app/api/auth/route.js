import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, initDatabase } from "@/lib/db";
import crypto from "crypto";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_DEFAULT_EMAIL || "admin@legendarmy.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(inputPassword, storedHash) {
  if (!inputPassword || !storedHash || typeof storedHash !== "string") {
    return false;
  }

  // Normalize hash: lowercase and strip PostgreSQL bytea '\x' or '0x' prefix if present
  let cleanStored = storedHash.trim().toLowerCase();
  if (cleanStored.startsWith("\\x") || cleanStored.startsWith("0x")) {
    cleanStored = cleanStored.slice(2);
  }

  // Hash input password with SHA-256
  const inputHashHex = hashPassword(inputPassword).toLowerCase();

  // Must strictly be valid 64-char SHA-256 hex string (reject plaintext like 'kageism')
  if (cleanStored.length !== 64 || inputHashHex.length !== 64) {
    return false;
  }

  try {
    const storedBuf = Buffer.from(cleanStored, "hex");
    const inputBuf = Buffer.from(inputHashHex, "hex");
    if (storedBuf.length !== 32 || inputBuf.length !== 32) {
      return false;
    }
    return crypto.timingSafeEqual(storedBuf, inputBuf);
  } catch {
    return false;
  }
}

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

    const normalizedEmail = email.toLowerCase().trim();
    let authenticatedUser = null;

    // 1. Check Neon PostgreSQL Database admin_users table
    const sql = getDb();
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, email, password_hash AS "passwordHash", display_name AS "displayName"
          FROM admin_users
          WHERE email = ${normalizedEmail}
          LIMIT 1;
        `;

        if (rows.length > 0) {
          const dbUser = rows[0];
          if (verifyPassword(password, dbUser.passwordHash)) {
            authenticatedUser = {
              id: dbUser.id,
              email: dbUser.email,
              displayName: dbUser.displayName,
              role: "admin",
            };
          }
        }
      } catch (dbErr) {
        if (dbErr.message?.includes("does not exist")) {
          await initDatabase().catch(() => {});
        }
      }
    }

    // 2. Fallback to Environment Variables (Default Admin)
    if (!authenticatedUser) {
      const isDefaultMatch =
        normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase().trim() &&
        password === DEFAULT_ADMIN_PASSWORD;

      if (isDefaultMatch) {
        authenticatedUser = {
          email: normalizedEmail,
          displayName: "Super Admin",
          role: "admin",
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const sessionToken = Buffer.from(
      JSON.stringify({
        ...authenticatedUser,
        loginAt: Date.now(),
      })
    ).toString("base64");

    cookieStore.set("la_session", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: authenticatedUser,
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
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("la_session");
  return NextResponse.json({ success: true });
}
