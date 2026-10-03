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

    // Deduplicate members by nickname (case-insensitive), prioritizing latest updated and highest gear score
    const rows = await sql`
      SELECT * FROM (
        SELECT DISTINCT ON (LOWER(TRIM(nickname)))
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
        ORDER BY LOWER(TRIM(nickname)), updated_at DESC, gear_score DESC, created_at DESC
      ) AS unique_members
      ORDER BY "gearScore" DESC, nickname ASC;
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
        const nickname = (m.nickname || "Unknown").trim();
        const className = (m.className || m.class || "Unknown").trim();
        const level = Number(m.level) || 0;
        const gearScore = Number(m.gearScore) || 0;
        const role = m.role || "Member";
        const isActive = typeof m.isActive === "boolean" ? m.isActive : true;
        const notes = m.notes || "";

        // Check if member with this nickname already exists (case-insensitive)
        const existing = await sql`
          SELECT id FROM members WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(${nickname})) LIMIT 1;
        `;

        let row;
        if (existing.length > 0) {
          const existingId = existing[0].id;
          [row] = await sql`
            UPDATE members SET
              nickname = ${nickname},
              class_name = ${className},
              level = ${level},
              gear_score = ${gearScore},
              role = ${role},
              is_active = ${isActive},
              notes = COALESCE(NULLIF(${notes}, ''), notes),
              updated_at = NOW()
            WHERE id = ${existingId}
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
        } else {
          const id = m.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          [row] = await sql`
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
        }
        inserted.push(row);
      }
      return NextResponse.json({ success: true, count: inserted.length });
    }

    // Single insert
    const nickname = (body.nickname?.trim() || "Unknown").trim();
    const className = (body.className?.trim() || "Unknown").trim();
    const level = Number(body.level) || 0;
    const gearScore = Number(body.gearScore) || 0;
    const role = body.role || "Member";
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const notes = body.notes || "";

    // Check if member with this nickname already exists (case-insensitive)
    const existing = await sql`
      SELECT id FROM members WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(${nickname})) LIMIT 1;
    `;

    let member;
    if (existing.length > 0) {
      const existingId = existing[0].id;
      [member] = await sql`
        UPDATE members SET
          nickname = ${nickname},
          class_name = ${className},
          level = ${level},
          gear_score = ${gearScore},
          role = ${role},
          is_active = ${isActive},
          notes = COALESCE(NULLIF(${notes}, ''), notes),
          updated_at = NOW()
        WHERE id = ${existingId}
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
    } else {
      const id = body.id || `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      [member] = await sql`
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
    }

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
