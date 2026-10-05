import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Endpoint: Retrieves detailed registration info including full roster and Discord IDs.
 *
 * Why this exists:
 * Supplies administrators with full player contact records and audit information for a specific team.
 *
 * @param {Request} request - Incoming authenticated admin request
 * @param {Object} context - Route context params containing registration ID
 * @returns {Promise<NextResponse>} JSON response with registration details and roster
 */
export async function GET(request, context) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const regRows = await sql`
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
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (regRows.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const registration = regRows[0];

    const roster = await sql`
      SELECT 
        id,
        nickname,
        discord_id AS "discordId",
        role,
        created_at AS "createdAt"
      FROM valkyrie_cup_members
      WHERE valkyrie_cup_registration_id = ${id}
      ORDER BY 
        CASE WHEN role = 'captain' THEN 1 ELSE 2 END ASC,
        created_at ASC;
    `;

    const captainMember = roster.find((m) => m.role === "captain");

    return NextResponse.json({
      success: true,
      registration: {
        ...registration,
        captain: captainMember ? captainMember.nickname : "TBA",
        captainDiscordId: captainMember ? captainMember.discordId : "",
      },
      roster,
    });
  } catch (error) {
    console.error("GET /api/admin/valkyrie-cup/registrations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve registration detail" },
      { status: 500 }
    );
  }
}

/**
 * Admin Endpoint: Deletes a tournament registration record.
 *
 * Why this exists:
 * Allows administrators to purge invalid, duplicate, or test submissions.
 * Members are automatically removed via database foreign key CASCADE.
 *
 * @param {Request} request - Incoming authenticated admin request
 * @param {Object} context - Route context params containing registration ID
 * @returns {Promise<NextResponse>} JSON response indicating deletion status
 */
export async function DELETE(request, context) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const deleteResult = await sql`
      DELETE FROM valkyrie_cup_registrations
      WHERE id = ${id}
      RETURNING id, team_name AS "teamName";
    `;

    if (deleteResult.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Registration for "${deleteResult[0].teamName}" deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/admin/valkyrie-cup/registrations/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    );
  }
}
