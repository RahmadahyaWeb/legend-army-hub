import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { id: guildLeagueId } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { memberId, nickname, className, level, gearScore, teamNumber, slotNumber } = body;

    if (!guildLeagueId || !teamNumber || !slotNumber) {
      return NextResponse.json(
        { error: "guildLeagueId, teamNumber, and slotNumber are required." },
        { status: 400 }
      );
    }

    const rosterId = `${guildLeagueId}_t${teamNumber}_s${slotNumber}`;
    const cleanNick = (nickname || "Unknown").trim();

    // Remove them from any existing slot in this guild league to prevent duplicates (check BOTH memberId and nickname)
    if (memberId || cleanNick) {
      await sql`
        DELETE FROM guild_league_rosters 
        WHERE guild_league_id = ${guildLeagueId} 
          AND (
            (${memberId ? sql`member_id = ${memberId}` : sql`FALSE`})
            OR (${cleanNick ? sql`LOWER(TRIM(nickname)) = LOWER(TRIM(${cleanNick}))` : sql`FALSE`})
          )
          AND NOT (team_number = ${Number(teamNumber)} AND slot_number = ${Number(slotNumber)});
      `;
    }

    // Upsert into slot
    const [saved] = await sql`
      INSERT INTO guild_league_rosters (
        id, guild_league_id, member_id, nickname, class_name, level, gear_score, team_number, slot_number, updated_at
      ) VALUES (
        ${rosterId}, ${guildLeagueId}, ${memberId || null}, ${cleanNick}, 
        ${className || ""}, ${Number(level) || 0}, ${Number(gearScore) || 0}, 
        ${Number(teamNumber)}, ${Number(slotNumber)}, NOW()
      )
      ON CONFLICT (guild_league_id, team_number, slot_number) DO UPDATE SET
        member_id = EXCLUDED.member_id,
        nickname = EXCLUDED.nickname,
        class_name = EXCLUDED.class_name,
        level = EXCLUDED.level,
        gear_score = EXCLUDED.gear_score,
        updated_at = NOW()
      RETURNING 
        id, guild_league_id AS "guildLeagueId", member_id AS "memberId",
        nickname, class_name AS "className", level, gear_score AS "gearScore",
        team_number AS "teamNumber", slot_number AS "slotNumber";
    `;

    return NextResponse.json({ success: true, rosterMember: saved });
  } catch (error) {
    console.error("POST /api/guild-leagues/[id]/roster error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: guildLeagueId } = await params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const teamNumber = searchParams.get("teamNumber");
    const slotNumber = searchParams.get("slotNumber");
    const rosterId = searchParams.get("rosterId");

    if (rosterId) {
      await sql`DELETE FROM guild_league_rosters WHERE id = ${rosterId} AND guild_league_id = ${guildLeagueId};`;
    } else if (teamNumber && slotNumber) {
      await sql`
        DELETE FROM guild_league_rosters 
        WHERE guild_league_id = ${guildLeagueId} 
          AND team_number = ${Number(teamNumber)} 
          AND slot_number = ${Number(slotNumber)};
      `;
    } else {
      return NextResponse.json(
        { error: "rosterId or (teamNumber and slotNumber) is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/guild-leagues/[id]/roster error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
