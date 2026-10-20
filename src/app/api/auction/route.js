import { NextResponse } from "next/server";
import { getDb, initDatabase } from "@/lib/db";

/**
 * Public Auction & Queue Board API Handler
 *
 * Why this exists:
 * Provides public read access to active auction items, slot queues,
 * guidelines, and past auction winners for the Arena Bid interface.
 *
 * Tricky logic:
 * Silently runs table check / auto-initialization on first call if tables do not exist yet,
 * ensuring zero manual migration requirements in serverless Neon environments.
 *
 * @returns {Promise<NextResponse>} JSON response containing categorized items, stats, rules, and winners
 */
export async function GET() {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection is not configured." },
        { status: 500 }
      );
    }

    // Auto-initialize schema if auction_items does not exist
    try {
      await sql`SELECT 1 FROM auction_items LIMIT 1;`;
    } catch {
      await initDatabase();
    }

    // Fetch active items ordered by sort_order
    const items = await sql`
      SELECT id, category, title, hint, image_url, sort_order, is_active
      FROM auction_items
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC;
    `;

    // Fetch all occupied queue slots ordered by slot_number
    const slots = await sql`
      SELECT id, item_id, slot_number, nickname, discord_tag, level, note
      FROM auction_slots
      ORDER BY item_id, slot_number ASC;
    `;

    // Fetch rules
    const rules = await sql`
      SELECT id, title, lines, sort_order
      FROM auction_rules
      ORDER BY sort_order ASC;
    `;

    // Fetch winners (latest 20)
    const winners = await sql`
      SELECT id, item_title, nickname, note, won_at
      FROM auction_winners
      ORDER BY won_at DESC
      LIMIT 20;
    `;

    // Fetch total signups count
    const signupsCountResult = await sql`
      SELECT COUNT(*)::int as count FROM auction_signups;
    `;
    const signupsCount = signupsCountResult[0]?.count || 0;

    // Attach slots to their respective items
    const slotsByItem = {};
    for (const s of slots) {
      if (!slotsByItem[s.item_id]) {
        slotsByItem[s.item_id] = [];
      }
      slotsByItem[s.item_id].push(s);
    }

    const itemsWithSlots = items.map((item) => ({
      ...item,
      slots: slotsByItem[item.id] || [],
    }));

    // Calculate unique queued participants
    const uniqueQueued = new Set();
    slots.forEach((s) => {
      if (s.nickname) {
        uniqueQueued.add(s.nickname.trim().toLowerCase());
      }
    });

    return NextResponse.json({
      ok: true,
      items: itemsWithSlots,
      rules,
      winners,
      stats: {
        totalItems: items.length,
        totalQueued: uniqueQueued.size,
        totalSignups: signupsCount,
      },
    });
  } catch (err) {
    console.error("GET /api/auction error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch auction board." },
      { status: 500 }
    );
  }
}
