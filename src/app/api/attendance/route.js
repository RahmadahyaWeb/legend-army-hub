import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Retrieves attendance records optionally filtered by guildLeagueId.
 * Joined with members table to include current nicknames and gear scores.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @returns {Promise<NextResponse>} List of attendances
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildLeagueId = searchParams.get("guildLeagueId");
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ attendances: [] });
    }

    let rows;
    if (guildLeagueId) {
      rows = await sql`
        SELECT 
          a.id,
          a.guild_league_id AS "guildLeagueId",
          a.member_id AS "memberId",
          a.status,
          a.notes,
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          m.nickname,
          m.class_name AS "className",
          m.gear_score AS "gearScore"
        FROM attendances a
        LEFT JOIN members m ON a.member_id = m.id
        WHERE a.guild_league_id = ${guildLeagueId}
        ORDER BY a.created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT 
          a.id,
          a.guild_league_id AS "guildLeagueId",
          a.member_id AS "memberId",
          a.status,
          a.notes,
          a.created_at AS "createdAt",
          a.updated_at AS "updatedAt",
          m.nickname,
          m.class_name AS "className"
        FROM attendances a
        LEFT JOIN members m ON a.member_id = m.id
        ORDER BY a.created_at DESC;
      `;
    }

    return NextResponse.json({ attendances: rows });
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    if (error.message?.includes("does not exist")) {
      await initDatabase().catch(() => {});
      return NextResponse.json({ attendances: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Upserts a member's attendance status for a specific guild league event.
 * Guarded by requireAdmin so only authorized officers can submit roll-calls.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @returns {Promise<NextResponse>} Recorded attendance row
 */
export async function POST(request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { guildLeagueId, memberId, status = "present", notes = "" } = body;

    if (!guildLeagueId || !memberId) {
      return NextResponse.json({ error: "guildLeagueId and memberId are required" }, { status: 400 });
    }

    const id = `${guildLeagueId}_${memberId}`;

    const [row] = await sql`
      INSERT INTO attendances (id, guild_league_id, member_id, status, notes, created_at, updated_at)
      VALUES (${id}, ${guildLeagueId}, ${memberId}, ${status}, ${notes}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING 
        id, guild_league_id AS "guildLeagueId", member_id AS "memberId", status, notes, updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, attendance: row });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
