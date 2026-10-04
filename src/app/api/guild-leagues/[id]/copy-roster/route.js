import { NextResponse } from "next/server";
import { getDb, syncRosterWithMembers } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Copies team and roster slot configurations from a source league to a target league.
 * Guarded by requireAdmin to ensure only authenticated guild officers can perform batch overwrites.
 *
 * Why this exists:
 * Officers frequently want to carry over successful line-ups from previous Guild League
 * matches into new events (such as Polarity or next week's Guild League) without
 * manually re-assigning dozens of members one by one.
 *
 * Tricky logic:
 * Different event types have different formation capacities (e.g. Guild League has 10 members/team,
 * while Polarity strictly has 5 members/team across 10 teams). When copying between events with
 * different team structures, the source roster is sequentially packed into the target's slots
 * so that no member ends up in an invisible slot number (> 5).
 *
 * @param {Request} request - Next.js HTTP Request object
 * @param {{ params: Promise<{ id: string }> }} context - Route parameters containing target guildLeagueId
 * @returns {Promise<NextResponse>} Result summary of copied roster members
 */
export async function POST(request, { params }) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) return authCheck;

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

    if (sourceLeagueId === targetLeagueId) {
      return NextResponse.json(
        { error: "Cannot copy roster into the same event" },
        { status: 400 }
      );
    }

    // Fetch target event configuration
    const [targetLeague] = await sql`
      SELECT id, name, max_teams, members_per_team, max_roster, event_type
      FROM guild_leagues
      WHERE id = ${targetLeagueId};
    `;

    if (!targetLeague) {
      return NextResponse.json({ error: "Target event not found" }, { status: 404 });
    }

    // Fetch source event configuration
    const [sourceLeague] = await sql`
      SELECT id, name, max_teams, members_per_team, max_roster, event_type
      FROM guild_leagues
      WHERE id = ${sourceLeagueId};
    `;

    if (!sourceLeague) {
      return NextResponse.json({ error: "Source event not found" }, { status: 404 });
    }

    const targetMaxTeams = Number(targetLeague.max_teams) || (targetLeague.event_type === "polarity" ? 10 : 2);
    const targetMembersPerTeam = Number(targetLeague.members_per_team) || (targetLeague.event_type === "polarity" ? 5 : 10);
    const targetCapacity = targetMaxTeams * targetMembersPerTeam;

    const sourceMembersPerTeam = Number(sourceLeague.members_per_team) || (sourceLeague.event_type === "polarity" ? 5 : 10);

    // Fetch source roster ordered by original assignment
    const sourceRoster = await sql`
      SELECT member_id, nickname, class_name, level, gear_score, team_number, slot_number
      FROM guild_league_rosters
      WHERE guild_league_id = ${sourceLeagueId}
      ORDER BY team_number ASC, slot_number ASC;
    `;

    // Fetch source teams
    const sourceTeams = await sql`
      SELECT team_number, name, lane
      FROM guild_league_teams
      WHERE guild_league_id = ${sourceLeagueId}
      ORDER BY team_number ASC;
    `;

    if (overwrite) {
      await sql`DELETE FROM guild_league_rosters WHERE guild_league_id = ${targetLeagueId};`;
    }

    // Copy team names/lanes if within target team bounds
    const teamMap = new Map();
    for (const team of sourceTeams) {
      if (team.team_number <= targetMaxTeams) {
        teamMap.set(team.team_number, team);
        const teamId = `${targetLeagueId}_team_${team.team_number}`;
        await sql`
          INSERT INTO guild_league_teams (id, guild_league_id, team_number, name, lane, updated_at)
          VALUES (${teamId}, ${targetLeagueId}, ${team.team_number}, ${team.name || `Team ${team.team_number}`}, ${team.lane || ""}, NOW())
          ON CONFLICT (guild_league_id, team_number) DO UPDATE SET
            name = EXCLUDED.name,
            lane = EXCLUDED.lane,
            updated_at = NOW();
        `;
      }
    }

    // Ensure all target teams up to targetMaxTeams exist
    for (let t = 1; t <= targetMaxTeams; t++) {
      if (!teamMap.has(t)) {
        const teamId = `${targetLeagueId}_team_${t}`;
        await sql`
          INSERT INTO guild_league_teams (id, guild_league_id, team_number, name, lane, updated_at)
          VALUES (${teamId}, ${targetLeagueId}, ${t}, ${`Team ${t}`}, '', NOW())
          ON CONFLICT (guild_league_id, team_number) DO NOTHING;
        `;
      }
    }

    let count = 0;
    const isStructureDifferent = targetMembersPerTeam !== sourceMembersPerTeam;

    if (isStructureDifferent) {
      // Re-pack roster sequentially into target team slots to avoid exceeding membersPerTeam
      const membersToCopy = sourceRoster.slice(0, targetCapacity);

      for (let i = 0; i < membersToCopy.length; i++) {
        const r = membersToCopy[i];
        const newTeamNumber = Math.floor(i / targetMembersPerTeam) + 1;
        const newSlotNumber = (i % targetMembersPerTeam) + 1;

        if (newTeamNumber > targetMaxTeams) break;

        const rosterId = `${targetLeagueId}_t${newTeamNumber}_s${newSlotNumber}`;
        await sql`
          INSERT INTO guild_league_rosters (
            id, guild_league_id, member_id, nickname, class_name, level, gear_score, team_number, slot_number, updated_at
          ) VALUES (
            ${rosterId}, ${targetLeagueId}, ${r.member_id}, ${r.nickname}, ${r.class_name},
            ${r.level}, ${r.gear_score}, ${newTeamNumber}, ${newSlotNumber}, NOW()
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
    } else {
      // Same slot structure: retain exact team and slot locations if within bounds
      for (const r of sourceRoster) {
        if (r.team_number <= targetMaxTeams && r.slot_number <= targetMembersPerTeam) {
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
      }
    }

    // Synchronize gear scores and stats with current members table
    await syncRosterWithMembers(sql, targetLeagueId);

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
