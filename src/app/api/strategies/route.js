import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Retrieves all battle strategies, sorted by latest update timestamp.
 * Accessible to guild members for tactical briefing.
 *
 * @returns {Promise<NextResponse>} List of strategies
 */
export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ strategies: [] });
    }

    const rows = await sql`
      SELECT 
        id,
        title,
        category,
        content,
        map_name AS "mapName",
        tags,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM strategies
      ORDER BY updated_at DESC;
    `;

    return NextResponse.json({ strategies: rows });
  } catch (error) {
    console.error("GET /api/strategies error:", error);
    if (error.message?.includes("does not exist")) {
      await initDatabase().catch(() => {});
      return NextResponse.json({ strategies: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Creates a new strategy entry.
 * Guarded by requireAdmin so only authorized officers can publish official battle plans.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @returns {Promise<NextResponse>} Created strategy record
 */
export async function POST(request) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const id = body.id || `strat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const title = body.title?.trim() || "Untitled Strategy";
    const category = body.category?.trim() || "General";
    const content = body.content || "";
    const mapName = body.mapName?.trim() || "";
    const tags = Array.isArray(body.tags) ? body.tags.join(",") : (body.tags || "");

    const [row] = await sql`
      INSERT INTO strategies (id, title, category, content, map_name, tags, created_at, updated_at)
      VALUES (${id}, ${title}, ${category}, ${content}, ${mapName}, ${tags}, NOW(), NOW())
      RETURNING 
        id, title, category, content, map_name AS "mapName", tags, created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, strategy: row });
  } catch (error) {
    console.error("POST /api/strategies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Updates an existing strategy entry.
 * Guarded by requireAdmin to prevent unauthorized alterations to tactics.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @returns {Promise<NextResponse>} Updated strategy record
 */
export async function PUT(request) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, title, category, content, mapName, tags } = body;

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 });
    }

    const formattedTags = Array.isArray(tags) ? tags.join(",") : (tags !== undefined ? tags : null);

    const [row] = await sql`
      UPDATE strategies SET
        title = COALESCE(${title}, title),
        category = COALESCE(${category}, category),
        content = COALESCE(${content}, content),
        map_name = COALESCE(${mapName}, map_name),
        tags = COALESCE(${formattedTags}, tags),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id, title, category, content, map_name AS "mapName", tags, created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, strategy: row });
  } catch (error) {
    console.error("PUT /api/strategies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Deletes a strategy entry.
 * Guarded by requireAdmin to ensure only officers can permanently remove tactics.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @returns {Promise<NextResponse>} Confirmation of deletion
 */
export async function DELETE(request) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 });
    }

    await sql`DELETE FROM strategies WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/strategies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
