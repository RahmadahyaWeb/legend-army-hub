import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ users: [] });
    }

    const rows = await sql`
      SELECT id, email, display_name AS "displayName", created_at AS "createdAt"
      FROM admin_users
      ORDER BY created_at ASC;
    `;

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    if (error.message?.includes("does not exist")) {
      await initDatabase().catch(() => {});
      return NextResponse.json({ users: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { email, password, displayName = "Admin" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passwordHash = hashPassword(password);
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await sql`
      INSERT INTO admin_users (id, email, password_hash, display_name, created_at)
      VALUES (${id}, ${normalizedEmail}, ${passwordHash}, ${displayName.trim()}, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name
      RETURNING id, email, display_name AS "displayName", created_at AS "createdAt";
    `;

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await sql`DELETE FROM admin_users WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
