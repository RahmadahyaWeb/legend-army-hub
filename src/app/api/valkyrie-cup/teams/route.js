import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Public Endpoint: Lists public Valkyrie Cup tournament teams.
 *
 * Why this exists:
 * Provides public, unauthenticated access to the Valkyrie Cup Registered Teams directory.
 * Strictly filters out rejected registrations and excludes private player information (Discord IDs).
 *
 * Tricky logic:
 * Default ordering places Approved teams first, followed by Pending teams, and then by most
 * recently registered date (`created_at DESC`).
 *
 * @param {Request} request - Incoming HTTP GET request with optional query filters
 * @returns {Promise<NextResponse>} JSON response containing teams list and high-level summary metrics
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
    const guildFilter = searchParams.get("guild") || "all";
    const statusFilter = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // 1. Fetch public teams with captain and member count
    // Strictly restrict to 'pending' and 'approved' status
    const teams = await sql`
      SELECT 
        r.id,
        r.team_name AS "teamName",
        r.guild,
        r.status,
        r.created_at AS "createdAt",
        COALESCE(cap.nickname, 'TBA') AS "captain",
        COUNT(m.id)::int AS "totalPlayers"
      FROM valkyrie_cup_registrations r
      LEFT JOIN valkyrie_cup_members cap 
        ON cap.valkyrie_cup_registration_id = r.id AND cap.role = 'captain'
      LEFT JOIN valkyrie_cup_members m 
        ON m.valkyrie_cup_registration_id = r.id
      WHERE r.status IN ('pending', 'approved')
      GROUP BY r.id, r.team_name, r.guild, r.status, r.created_at, cap.nickname
      ORDER BY 
        CASE WHEN r.status = 'approved' THEN 1 WHEN r.status = 'pending' THEN 2 ELSE 3 END ASC,
        r.created_at DESC;
    `;

    // 2. Fetch summary metrics for active teams
    const metricsResult = await sql`
      SELECT
        COUNT(*)::int AS "totalTeams",
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int AS "approvedTeams",
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::int AS "pendingTeams",
        COUNT(CASE WHEN guild = 'LegendArmy1' THEN 1 END)::int AS "legendArmy1Teams",
        COUNT(CASE WHEN guild = 'LegendArmy2' THEN 1 END)::int AS "legendArmy2Teams"
      FROM valkyrie_cup_registrations
      WHERE status IN ('pending', 'approved');
    `;

    const summary = metricsResult[0] || {
      totalTeams: 0,
      approvedTeams: 0,
      pendingTeams: 0,
      legendArmy1Teams: 0,
      legendArmy2Teams: 0,
    };

    // 3. Apply server-side filtering if requested
    let filtered = teams;
    if (guildFilter !== "all") {
      filtered = filtered.filter((t) => t.guild === guildFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.teamName.toLowerCase().includes(search) ||
          t.captain.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      teams: filtered,
      summary,
    });
  } catch (error) {
    console.error("GET /api/valkyrie-cup/teams error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve tournament teams" },
      { status: 500 }
    );
  }
}
