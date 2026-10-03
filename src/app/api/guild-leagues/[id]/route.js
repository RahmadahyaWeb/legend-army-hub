import { NextResponse } from "next/server";
import { getDb, syncRosterWithMembers } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({
        error: "DATABASE_URL not configured.",
      }, { status: 500 });
    }

    // Automatically synchronize gear score, level, and class with current members table
    await syncRosterWithMembers(sql, id);

    const [league] = await sql`
      SELECT 
        id,
        name,
        opponent,
        notes,
        match_date AS "matchDate",
        match_date AS "date",
        status,
        COALESCE(event_type, 'guild_league') AS "eventType",
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
        r.id,
        r.guild_league_id AS "guildLeagueId",
        COALESCE(m.id, r.member_id) AS "memberId",
        COALESCE(m.nickname, r.nickname) AS nickname,
        COALESCE(m.class_name, r.class_name) AS "className",
        COALESCE(m.level, r.level) AS level,
        COALESCE(m.gear_score, r.gear_score) AS "gearScore",
        r.team_number AS "teamNumber",
        r.slot_number AS "slotNumber",
        r.created_at AS "createdAt"
      FROM guild_league_rosters r
      LEFT JOIN (
        SELECT DISTINCT ON (LOWER(TRIM(nickname)))
          id, nickname, class_name, level, gear_score
        FROM members
        ORDER BY LOWER(TRIM(nickname)), updated_at DESC, gear_score DESC
      ) m ON (
        (r.member_id IS NOT NULL AND r.member_id = m.id)
        OR LOWER(TRIM(r.nickname)) = LOWER(TRIM(m.nickname))
      )
      WHERE r.guild_league_id = ${id}
      ORDER BY r.team_number ASC, r.slot_number ASC;
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
    const authCheck = await requireAdmin(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const { id } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, opponent, notes, matchDate, status, eventType, maxTeams, membersPerTeam } = body;

    const [updated] = await sql`
      UPDATE guild_leagues SET
        name = COALESCE(${name}, name),
        opponent = COALESCE(${opponent}, opponent),
        notes = COALESCE(${notes}, notes),
        match_date = COALESCE(${matchDate ? new Date(matchDate).toISOString() : null}, match_date),
        status = COALESCE(${status}, status),
        event_type = COALESCE(${eventType}, event_type),
        max_teams = COALESCE(${maxTeams !== undefined ? Number(maxTeams) : null}, max_teams),
        members_per_team = COALESCE(${membersPerTeam !== undefined ? Number(membersPerTeam) : null}, members_per_team),
        max_roster = COALESCE(${maxTeams && membersPerTeam ? Number(maxTeams) * Number(membersPerTeam) : null}, max_roster),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id, name, opponent, notes, match_date AS "matchDate", match_date AS "date",
        status, event_type AS "eventType", max_teams AS "maxTeams", members_per_team AS "membersPerTeam",
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
    const authCheck = await requireAdmin(request);
    if (authCheck instanceof NextResponse) return authCheck;

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
