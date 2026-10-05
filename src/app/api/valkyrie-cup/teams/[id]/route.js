import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * Public Endpoint: Retrieves public details and roster of a specific Valkyrie Cup team.
 *
 * Why this exists:
 * Enables visitors to inspect an individual team's composition and registration status.
 *
 * Tricky logic:
 * Sanitizes roster records so Discord IDs are NEVER leaked on public views, unless the viewer
 * is an authenticated administrator or the user who registered the team.
 *
 * @param {Request} request - Incoming HTTP request
 * @param {Object} context - Route context params containing team ID
 * @returns {Promise<NextResponse>} JSON response with team metadata and sanitized roster
 */
export async function GET(request, context) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Team registration ID is required" },
        { status: 400 }
      );
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // 1. Fetch team registration record
    const regRows = await sql`
      SELECT 
        id,
        user_id AS "userId",
        team_name AS "teamName",
        guild,
        status,
        created_at AS "createdAt",
        reviewed_at AS "reviewedAt",
        rejection_reason AS "rejectionReason"
      FROM valkyrie_cup_registrations
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (regRows.length === 0) {
      return NextResponse.json(
        { error: "Team registration not found" },
        { status: 404 }
      );
    }

    const team = regRows[0];

    // Determine viewer privilege (Admin or Team Owner)
    const adminUser = await getSessionUser(request);
    const cookieStore = await cookies();
    const clientUserId = cookieStore.get("vc_user_id")?.value;
    const isOwner = Boolean(clientUserId && clientUserId === team.userId);
    const isAdmin = Boolean(adminUser);

    // If team is rejected and viewer is not admin or owner, hide it completely
    if (team.status === "rejected" && !isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Team registration not found" },
        { status: 404 }
      );
    }

    // 2. Fetch roster members ordered with Captain at position 1
    const members = await sql`
      SELECT 
        id,
        nickname,
        role,
        discord_id AS "discordId",
        created_at AS "createdAt"
      FROM valkyrie_cup_members
      WHERE valkyrie_cup_registration_id = ${id}
      ORDER BY 
        CASE WHEN role = 'captain' THEN 1 ELSE 2 END ASC,
        created_at ASC;
    `;

    // 3. Find captain nickname
    const captainMember = members.find((m) => m.role === "captain");
    const captainNickname = captainMember ? captainMember.nickname : "TBA";

    // 4. Sanitize roster: strip discordId if public viewer
    const sanitizedRoster = members.map((m) => {
      const item = {
        id: m.id,
        nickname: m.nickname,
        role: m.role,
      };
      if (isAdmin || isOwner) {
        item.discordId = m.discordId;
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        teamName: team.teamName,
        guild: team.guild,
        captain: captainNickname,
        status: team.status,
        createdAt: team.createdAt,
        rejectionReason: (isAdmin || isOwner) ? team.rejectionReason : undefined,
      },
      roster: sanitizedRoster,
    });
  } catch (error) {
    console.error("GET /api/valkyrie-cup/teams/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve team detail" },
      { status: 500 }
    );
  }
}
