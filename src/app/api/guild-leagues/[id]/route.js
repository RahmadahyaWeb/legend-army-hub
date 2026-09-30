import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({
        error: "DATABASE_URL not configured.",
      }, { status: 500 });
    }

    const [league] = await sql`
      SELECT 
        id,
        name,
        opponent,
        notes,
        match_date AS "matchDate",
        match_date AS "date",
        status,
        max_teams AS "maxTeams",
        members_per_team AS "membersPerTeam",
        max_roster AS "maxRoster",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM guild_leagues
      WHERE id = ${id};
    `;

    if (!league) {
      return NextResponse.json({ error: "Guild League not found" }, { status: 404 });
    }

    const teams = await sql`
      SELECT 
        id,
        guild_league_id AS "guildLeagueId",
        team_number AS "teamNumber",
        name,
        lane
      FROM guild_league_teams
      WHERE guild_league_id = ${id}
      ORDER BY team_number ASC;
    `;

    const roster = await sql`
      SELECT 
        id,
        guild_league_id AS "guildLeagueId",
        member_id AS "memberId",
        nickname,
        class_name AS "className",
        level,
        gear_score AS "gearScore",
        team_number AS "teamNumber",
        slot_number AS "slotNumber",
        created_at AS "createdAt"
      FROM guild_league_rosters
      WHERE guild_league_id = ${id}
      ORDER BY team_number ASC, slot_number ASC;
    `;

    return NextResponse.json({
      guildLeague: league,
      teams,
      roster,
    });
  } catch (error) {
    console.error("GET /api/guild-leagues/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, opponent, notes, matchDate, status, maxTeams, membersPerTeam } = body;

    const [updated] = await sql`
      UPDATE guild_leagues SET
        name = COALESCE(${name}, name),
        opponent = COALESCE(${opponent}, opponent),
        notes = COALESCE(${notes}, notes),
        match_date = COALESCE(${matchDate ? new Date(matchDate).toISOString() : null}, match_date),
        status = COALESCE(${status}, status),
        max_teams = COALESCE(${maxTeams !== undefined ? Number(maxTeams) : null}, max_teams),
        members_per_team = COALESCE(${membersPerTeam !== undefined ? Number(membersPerTeam) : null}, members_per_team),
        max_roster = COALESCE(${maxTeams && membersPerTeam ? Number(maxTeams) * Number(membersPerTeam) : null}, max_roster),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id, name, opponent, notes, match_date AS "matchDate", match_date AS "date",
        status, max_teams AS "maxTeams", members_per_team AS "membersPerTeam",
        max_roster AS "maxRoster", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    return NextResponse.json({ success: true, guildLeague: updated });
  } catch (error) {
    console.error("PUT /api/guild-leagues/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    await sql`DELETE FROM guild_leagues WHERE id = ${id};`;

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/guild-leagues/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
