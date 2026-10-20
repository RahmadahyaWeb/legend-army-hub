import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Auction Hub Data Provider
 *
 * Why this exists:
 * Delivers full state for the guild leadership command console: items catalog,
 * slot allocations, pending signup queue, winner log, and summary telemetry.
 *
 * Tricky logic:
 * Performs server-side status filtering and search indexing across signups
 * to maintain responsive performance as tournament and auction rosters scale.
 *
 * @param {Request} request - Incoming authenticated admin HTTP request
 * @returns {Promise<NextResponse>} JSON payload with consolidated admin data
 */
export async function GET(request) {
  try {
    const authCheck = await requireAdmin(request);
    if (authCheck instanceof NextResponse) return authCheck;

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not configured." },
        { status: 500 }
      );
    }

    try {
      await sql`SELECT 1 FROM auction_items LIMIT 1;`;
    } catch {
      await initDatabase();
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    // Fetch items with slots
    const items = await sql`
      SELECT id, category, title, hint, image_url, sort_order, is_active, created_at
      FROM auction_items
      ORDER BY category ASC, sort_order ASC, title ASC;
    `;

    const slots = await sql`
      SELECT id, item_id, slot_number, nickname, discord_tag, level, note, created_at
      FROM auction_slots
      ORDER BY item_id, slot_number ASC;
    `;

    const slotsByItem = {};
    for (const s of slots) {
      if (!slotsByItem[s.item_id]) slotsByItem[s.item_id] = [];
      slotsByItem[s.item_id].push(s);
    }

    const itemsWithSlots = items.map((item) => ({
      ...item,
      slots: slotsByItem[item.id] || [],
    }));

    // Fetch signups
    let signups;
    if (statusFilter !== "all" && search) {
      signups = await sql`
        SELECT id, item_id, item_title, nickname, discord_tag, level, quantity, status, admin_notes, assigned_slot, created_at
        FROM auction_signups
        WHERE status = ${statusFilter}
          AND (LOWER(nickname) LIKE ${`%${search}%`} OR LOWER(item_title) LIKE ${`%${search}%`} OR LOWER(discord_tag) LIKE ${`%${search}%`})
        ORDER BY created_at DESC;
      `;
    } else if (statusFilter !== "all") {
      signups = await sql`
        SELECT id, item_id, item_title, nickname, discord_tag, level, quantity, status, admin_notes, assigned_slot, created_at
        FROM auction_signups
        WHERE status = ${statusFilter}
        ORDER BY created_at DESC;
      `;
    } else if (search) {
      signups = await sql`
        SELECT id, item_id, item_title, nickname, discord_tag, level, quantity, status, admin_notes, assigned_slot, created_at
        FROM auction_signups
        WHERE LOWER(nickname) LIKE ${`%${search}%`} OR LOWER(item_title) LIKE ${`%${search}%`} OR LOWER(discord_tag) LIKE ${`%${search}%`}
        ORDER BY created_at DESC;
      `;
    } else {
      signups = await sql`
        SELECT id, item_id, item_title, nickname, discord_tag, level, quantity, status, admin_notes, assigned_slot, created_at
        FROM auction_signups
        ORDER BY created_at DESC;
      `;
    }

    // Fetch winners
    const winners = await sql`
      SELECT id, item_id, item_title, nickname, note, won_at, created_at
      FROM auction_winners
      ORDER BY won_at DESC;
    `;

    // Summary counts
    const counts = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
        COUNT(*)::int AS total
      FROM auction_signups;
    `;

    return NextResponse.json({
      ok: true,
      items: itemsWithSlots,
      signups,
      winners,
      summary: {
        pendingSignups: counts[0]?.pending || 0,
        approvedSignups: counts[0]?.approved || 0,
        rejectedSignups: counts[0]?.rejected || 0,
        totalSignups: counts[0]?.total || 0,
        totalActiveItems: items.filter((i) => i.is_active).length,
        totalQueuedSlots: slots.length,
        totalWinners: winners.length,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/lelang error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch admin auction data." },
      { status: 500 }
    );
  }
}
