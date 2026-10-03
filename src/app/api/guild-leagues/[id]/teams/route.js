import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Updates or creates team metadata (custom name, lane assignment) for a guild league.
 * Restricted to administrators to prevent unauthorized tactical reassignments.
 *
 * @param {Request} request - Next.js HTTP Request object
 * @param {{ params: Promise<{ id: string }> }} context - Route parameters containing guildLeagueId
 * @returns {Promise<NextResponse>} Upserted team record
 */
export async function PUT(request, { params }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id: guildLeagueId } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { teamNumber, name, lane } = body;

    if (!teamNumber) {
      return NextResponse.json({ error: "teamNumber is required" }, { status: 400 });
    }

    const teamId = `${guildLeagueId}_team_${teamNumber}`;

    const [team] = await sql`
      INSERT INTO guild_league_teams (id, guild_league_id, team_number, name, lane, updated_at)
      VALUES (${teamId}, ${guildLeagueId}, ${Number(teamNumber)}, ${name || ""}, ${lane || ""}, NOW())
      ON CONFLICT (guild_league_id, team_number) DO UPDATE SET
        name = EXCLUDED.name,
        lane = EXCLUDED.lane,
        updated_at = NOW()
      RETURNING 
        id, guild_league_id AS "guildLeagueId", team_number AS "teamNumber", name, lane;
    `;

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("PUT /api/guild-leagues/[id]/teams error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
