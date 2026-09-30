import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { id: targetLeagueId } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { sourceLeagueId, overwrite = true } = body;

    if (!sourceLeagueId) {
      return NextResponse.json(
        { error: "sourceLeagueId is required" },
        { status: 400 }
      );
    }

    // Fetch source roster
    const sourceRoster = await sql`
      SELECT member_id, nickname, class_name, level, gear_score, team_number, slot_number
      FROM guild_league_rosters
      WHERE guild_league_id = ${sourceLeagueId};
    `;

    // Fetch source teams
    const sourceTeams = await sql`
      SELECT team_number, name, lane
      FROM guild_league_teams
      WHERE guild_league_id = ${sourceLeagueId};
    `;

    if (overwrite) {
      await sql`DELETE FROM guild_league_rosters WHERE guild_league_id = ${targetLeagueId};`;
    }

    // Copy teams info
    for (const team of sourceTeams) {
      const teamId = `${targetLeagueId}_team_${team.team_number}`;
      await sql`
        INSERT INTO guild_league_teams (id, guild_league_id, team_number, name, lane, updated_at)
        VALUES (${teamId}, ${targetLeagueId}, ${team.team_number}, ${team.name}, ${team.lane}, NOW())
        ON CONFLICT (guild_league_id, team_number) DO UPDATE SET
          name = EXCLUDED.name,
          lane = EXCLUDED.lane,
          updated_at = NOW();
      `;
    }

    // Copy roster members
    let count = 0;
    for (const r of sourceRoster) {
      const rosterId = `${targetLeagueId}_t${r.team_number}_s${r.slot_number}`;
      await sql`
        INSERT INTO guild_league_rosters (
          id, guild_league_id, member_id, nickname, class_name, level, gear_score, team_number, slot_number, updated_at
        ) VALUES (
          ${rosterId}, ${targetLeagueId}, ${r.member_id}, ${r.nickname}, ${r.class_name},
          ${r.level}, ${r.gear_score}, ${r.team_number}, ${r.slot_number}, NOW()
        )
        ON CONFLICT (guild_league_id, team_number, slot_number) DO UPDATE SET
          member_id = EXCLUDED.member_id,
          nickname = EXCLUDED.nickname,
          class_name = EXCLUDED.class_name,
          level = EXCLUDED.level,
          gear_score = EXCLUDED.gear_score,
          updated_at = NOW();
      `;
      count++;
    }

    return NextResponse.json({
      success: true,
      copiedCount: count,
      message: `Copied ${count} roster members successfully.`,
    });
  } catch (error) {
    console.error("POST /api/guild-leagues/[id]/copy-roster error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
