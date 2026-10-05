import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * Endpoint: Retrieves all team registrations submitted by the current user session.
 *
 * Why this exists:
 * Powers the "My Registration" view where participants can monitor their team's review status,
 * view all player Discord IDs, and read administrative feedback if rejected.
 *
 * Tricky logic:
 * Resolves user identity from cookie (`vc_user_id`), admin session, or explicit `userId` query parameter.
 * Also supports an optional recovery lookup by `teamName` + `captainDiscordId` to allow users to retrieve
 * their submission if they switched devices or cleared browser cache.
 *
 * @param {Request} request - Incoming HTTP GET request
 * @returns {Promise<NextResponse>} JSON response with user's registrations and full rosters
 */
export async function GET(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paramUserId = searchParams.get("userId");
    const lookupTeamName = searchParams.get("teamName")?.trim();
    const lookupDiscordId = searchParams.get("captainDiscordId")?.trim();

    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("vc_user_id")?.value;
    const adminUser = await getSessionUser(request);

    let effectiveUserId = paramUserId || cookieUserId || adminUser?.id || adminUser?.email || null;

    let registrations = [];

    if (lookupTeamName && lookupDiscordId) {
      // Recovery lookup: Find registration where team name matches and captain discord ID matches
      registrations = await sql`
        SELECT 
          r.id,
          r.user_id AS "userId",
          r.team_name AS "teamName",
          r.guild,
          r.status,
          r.reviewed_by AS "reviewedBy",
          r.reviewed_at AS "reviewedAt",
          r.rejection_reason AS "rejectionReason",
          r.created_at AS "createdAt",
          r.updated_at AS "updatedAt"
        FROM valkyrie_cup_registrations r
        JOIN valkyrie_cup_members m 
          ON m.valkyrie_cup_registration_id = r.id AND m.role = 'captain'
        WHERE LOWER(TRIM(r.team_name)) = LOWER(TRIM(${lookupTeamName}))
          AND LOWER(TRIM(m.discord_id)) = LOWER(TRIM(${lookupDiscordId}))
        ORDER BY r.created_at DESC;
      `;

      // If lookup succeeded and user doesn't have cookie, link it
      if (registrations.length > 0 && !cookieUserId) {
        cookieStore.set("vc_user_id", registrations[0].userId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
        });
      }
    } else if (effectiveUserId) {
      // Standard lookup: Find all registrations by this user_id
      registrations = await sql`
        SELECT 
          id,
          user_id AS "userId",
          team_name AS "teamName",
          guild,
          status,
          reviewed_by AS "reviewedBy",
          reviewed_at AS "reviewedAt",
          rejection_reason AS "rejectionReason",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM valkyrie_cup_registrations
        WHERE user_id = ${effectiveUserId}
        ORDER BY created_at DESC;
      `;
    }

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        registrations: [],
        userId: effectiveUserId,
      });
    }

    // Fetch full roster with Discord IDs for each team
    const registrationIds = registrations.map((r) => r.id);
    const members = await sql`
      SELECT 
        id,
        valkyrie_cup_registration_id AS "registrationId",
        nickname,
        discord_id AS "discordId",
        role,
        created_at AS "createdAt"
      FROM valkyrie_cup_members
      WHERE valkyrie_cup_registration_id = ANY(${registrationIds})
      ORDER BY 
        CASE WHEN role = 'captain' THEN 1 ELSE 2 END ASC,
        created_at ASC;
    `;

    // Group members by registrationId
    const membersByRegId = new Map();
    for (const m of members) {
      if (!membersByRegId.has(m.registrationId)) {
        membersByRegId.set(m.registrationId, []);
      }
      membersByRegId.get(m.registrationId).push(m);
    }

    const result = registrations.map((reg) => {
      const teamRoster = membersByRegId.get(reg.id) || [];
      const captainMember = teamRoster.find((m) => m.role === "captain");
      return {
        id: reg.id,
        teamName: reg.teamName,
        guild: reg.guild,
        status: reg.status,
        captain: captainMember ? captainMember.nickname : "TBA",
        captainDiscordId: captainMember ? captainMember.discordId : "",
        rejectionReason: reg.rejectionReason,
        reviewedBy: reg.reviewedBy,
        reviewedAt: reg.reviewedAt,
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt,
        roster: teamRoster,
      };
    });

    return NextResponse.json({
      success: true,
      registrations: result,
      userId: effectiveUserId,
    });
  } catch (error) {
    console.error("GET /api/valkyrie-cup/my-registration error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user registration records" },
      { status: 500 }
    );
  }
}
