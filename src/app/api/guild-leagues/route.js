import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({
        guildLeagues: [],
        warning: "DATABASE_URL not configured.",
      });
    }

    const leagues = await sql`
      SELECT 
        gl.id,
        gl.name,
        gl.opponent,
        gl.notes,
        gl.match_date AS "matchDate",
        gl.match_date AS "date",
        gl.status,
        COALESCE(gl.event_type, 'guild_league') AS "eventType",
        gl.max_teams AS "maxTeams",
        gl.members_per_team AS "membersPerTeam",
        gl.max_roster AS "maxRoster",
        gl.created_at AS "createdAt",
        gl.updated_at AS "updatedAt",
        COALESCE(r.roster_count, 0)::INT AS "assignedPlayers",
        COALESCE(r.roster_count, 0)::INT AS "rosterCount"
      FROM guild_leagues gl
      LEFT JOIN (
        SELECT guild_league_id, COUNT(*) AS roster_count
        FROM guild_league_rosters
        GROUP BY guild_league_id
      ) r ON gl.id = r.guild_league_id
      ORDER BY gl.match_date DESC NULLS LAST, gl.created_at DESC;
    `;

    return NextResponse.json({ guildLeagues: leagues });
  } catch (error) {
    console.error("GET /api/guild-leagues error:", error);
    if (error.message?.includes("does not exist")) {
      await initDatabase().catch(() => {});
      return NextResponse.json({ guildLeagues: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const id = body.id || `gl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const name = body.name?.trim() || "Guild League Match";
    const opponent = body.opponent?.trim() || "TBA";
    const notes = body.notes?.trim() || "";
    const matchDate = body.matchDate || body.date || new Date().toISOString();
    const status = body.status || "draft";
    const rawEventType = String(body.eventType || "").toLowerCase().trim();
    // Why this exists: Supports three distinct event categories (Guild League, War of Emperium, Polarity)
    // Polarity requires a strict fixed structure of exactly 10 teams with 5 players each (50 max capacity).
    const eventType = rawEventType === "woe" ? "woe" : rawEventType === "polarity" ? "polarity" : "guild_league";
    const maxTeams = eventType === "polarity" ? 10 : (Number(body.maxTeams) || 2);
    const membersPerTeam = eventType === "polarity" ? 5 : (Number(body.membersPerTeam) || 10);
    const maxRoster = maxTeams * membersPerTeam;

    const [league] = await sql`
      INSERT INTO guild_leagues (
        id, name, opponent, notes, match_date, status, event_type, max_teams, members_per_team, max_roster, created_at, updated_at
      ) VALUES (
        ${id}, ${name}, ${opponent}, ${notes}, ${matchDate}, ${status}, ${eventType}, ${maxTeams}, ${membersPerTeam}, ${maxRoster}, NOW(), NOW()
      )
      RETURNING 
        id, name, opponent, notes, match_date AS "matchDate", match_date AS "date",
        status, event_type AS "eventType", max_teams AS "maxTeams", members_per_team AS "membersPerTeam",
        max_roster AS "maxRoster", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    // Initialize default teams
    for (let i = 1; i <= maxTeams; i++) {
      const teamId = `${id}_team_${i}`;
      await sql`
        INSERT INTO guild_league_teams (id, guild_league_id, team_number, name, lane)
        VALUES (${teamId}, ${id}, ${i}, ${`Team ${i}`}, '')
        ON CONFLICT (guild_league_id, team_number) DO NOTHING;
      `;
    }

    return NextResponse.json({ success: true, guildLeague: league });
  } catch (error) {
    console.error("POST /api/guild-leagues error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
