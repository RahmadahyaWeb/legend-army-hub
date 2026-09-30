import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({
        members: [],
        warning: "DATABASE_URL not configured. Please set DATABASE_URL.",
      });
    }

    const rows = await sql`
      SELECT 
        id,
        nickname,
        class_name AS "className",
        level,
        gear_score AS "gearScore",
        role,
        is_active AS "isActive",
        notes,
        joined_at AS "joinedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM members
      ORDER BY gear_score DESC, nickname ASC;
    `;

    return NextResponse.json({ members: rows });
  } catch (error) {
    console.error("GET /api/members error:", error);
    // Auto-init if table does not exist
    if (error.message?.includes("does not exist")) {
      await initDatabase().catch(() => {});
      return NextResponse.json({ members: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Batch import
    if (Array.isArray(body.members)) {
      const inserted = [];
      for (const m of body.members) {
        const id = m.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const nickname = m.nickname || "Unknown";
        const className = m.className || m.class || "Unknown";
        const level = Number(m.level) || 0;
        const gearScore = Number(m.gearScore) || 0;
        const role = m.role || "Member";
        const isActive = typeof m.isActive === "boolean" ? m.isActive : true;
        const notes = m.notes || "";

        const [row] = await sql`
          INSERT INTO members (id, nickname, class_name, level, gear_score, role, is_active, notes, updated_at)
          VALUES (${id}, ${nickname}, ${className}, ${level}, ${gearScore}, ${role}, ${isActive}, ${notes}, NOW())
          ON CONFLICT (id) DO UPDATE SET
            nickname = EXCLUDED.nickname,
            class_name = EXCLUDED.class_name,
            level = EXCLUDED.level,
            gear_score = EXCLUDED.gear_score,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            notes = EXCLUDED.notes,
            updated_at = NOW()
          RETURNING *;
        `;
        inserted.push(row);
      }
      return NextResponse.json({ success: true, count: inserted.length });
    }

    // Single insert
    const id = body.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nickname = body.nickname?.trim() || "Unknown";
    const className = body.className?.trim() || "Unknown";
    const level = Number(body.level) || 0;
    const gearScore = Number(body.gearScore) || 0;
    const role = body.role || "Member";
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const notes = body.notes || "";

    const [member] = await sql`
      INSERT INTO members (id, nickname, class_name, level, gear_score, role, is_active, notes, updated_at)
      VALUES (${id}, ${nickname}, ${className}, ${level}, ${gearScore}, ${role}, ${isActive}, ${notes}, NOW())
      RETURNING 
        id,
        nickname,
        class_name AS "className",
        level,
        gear_score AS "gearScore",
        role,
        is_active AS "isActive",
        notes,
        joined_at AS "joinedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("POST /api/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, nickname, className, level, gearScore, role, isActive, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const [member] = await sql`
      UPDATE members SET
        nickname = COALESCE(${nickname}, nickname),
        class_name = COALESCE(${className}, class_name),
        level = COALESCE(${level !== undefined ? Number(level) : null}, level),
        gear_score = COALESCE(${gearScore !== undefined ? Number(gearScore) : null}, gear_score),
        role = COALESCE(${role}, role),
        is_active = COALESCE(${isActive !== undefined ? Boolean(isActive) : null}, is_active),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id,
        nickname,
        class_name AS "className",
        level,
        gear_score AS "gearScore",
        role,
        is_active AS "isActive",
        notes,
        joined_at AS "joinedAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("PUT /api/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    await sql`DELETE FROM members WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/members error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
