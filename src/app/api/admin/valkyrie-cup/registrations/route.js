import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Endpoint: Lists all Valkyrie Cup tournament registrations with administrative review data.
 *
 * Why this exists:
 * Powers the administrative management table allowing guild leaders to monitor, filter,
 * and search all tournament signups across all statuses (pending, approved, rejected).
 *
 * Tricky logic:
 * Performs an aggregation across registrations and roster members to support searching
 * by captain nickname, player nickname, or team name simultaneously.
 *
 * @param {Request} request - Incoming authenticated admin request
 * @returns {Promise<NextResponse>} JSON response with full registrations list and summary counts
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const guildFilter = searchParams.get("guild") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // 1. Fetch all registrations with member aggregation
    const rows = await sql`
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
        r.updated_at AS "updatedAt",
        COALESCE(cap.nickname, 'TBA') AS "captain",
        COALESCE(cap.discord_id, '') AS "captainDiscordId",
        COUNT(m.id)::int AS "totalPlayers",
        STRING_AGG(m.nickname, ', ') AS "allNicknames"
      FROM valkyrie_cup_registrations r
      LEFT JOIN valkyrie_cup_members cap 
        ON cap.valkyrie_cup_registration_id = r.id AND cap.role = 'captain'
      LEFT JOIN valkyrie_cup_members m 
        ON m.valkyrie_cup_registration_id = r.id
      GROUP BY 
        r.id, r.user_id, r.team_name, r.guild, r.status, 
        r.reviewed_by, r.reviewed_at, r.rejection_reason, 
        r.created_at, r.updated_at, cap.nickname, cap.discord_id
      ORDER BY 
        CASE WHEN r.status = 'pending' THEN 1 WHEN r.status = 'approved' THEN 2 ELSE 3 END ASC,
        r.created_at DESC;
    `;

    // 2. Fetch summary stats
    const statsResult = await sql`
      SELECT
        COUNT(*)::int AS "total",
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS "pending",
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int AS "approved",
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int AS "rejected",
        COUNT(CASE WHEN guild = 'LegendArmy1' THEN 1 END)::int AS "legendArmy1",
        COUNT(CASE WHEN guild = 'LegendArmy2' THEN 1 END)::int AS "legendArmy2"
      FROM valkyrie_cup_registrations;
    `;

    const summary = statsResult[0] || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      legendArmy1: 0,
      legendArmy2: 0,
    };

    // 3. Filter results
    let filtered = rows;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (guildFilter !== "all") {
      filtered = filtered.filter((r) => r.guild === guildFilter);
    }
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.teamName.toLowerCase().includes(search) ||
          r.captain.toLowerCase().includes(search) ||
          (r.allNicknames && r.allNicknames.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      registrations: filtered,
      summary,
    });
  } catch (error) {
    console.error("GET /api/admin/valkyrie-cup/registrations error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve tournament registrations" },
      { status: 500 }
    );
  }
}
