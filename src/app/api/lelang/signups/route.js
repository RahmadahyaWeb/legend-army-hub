import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";

/**
 * Public Auction Signups Handler
 *
 * Why this exists:
 * Allows guild combatants to submit requests to enter an item's bidding queue,
 * and feeds the public real-time signup activity board.
 *
 * Tricky logic:
 * Links the signup request to the exact auction_items ID if found by title or ID,
 * while maintaining a snapshot of item_title in case the item name or ID changes later.
 *
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response with signups list or submission status
 */
export async function GET(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "15", 10)), 50);

    const signups = await sql`
      SELECT id, item_title, nickname, discord_tag, level, quantity, status, created_at
      FROM auction_signups
      ORDER BY created_at DESC
      LIMIT ${limit};
    `;

    return NextResponse.json({
      ok: true,
      signups,
    });
  } catch (err) {
    console.error("GET /api/lelang/signups error:", err);
    return NextResponse.json(
      { error: "Failed to fetch signups." },
      { status: 500 }
    );
  }
}

/**
 * Submits a new queue signup request.
 *
 * @param {Request} request - Incoming HTTP POST request
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const nickname = (body.nickname || "").trim();
    const discordTag = (body.discordTag || body.contact || "").trim();
    const itemTitle = (body.itemTitle || body.item || "").trim();
    const itemId = (body.itemId || "").trim();
    const level = parseInt(body.level, 10) || 100;
    const quantity = Math.max(1, parseInt(body.quantity || body.qty, 10) || 1);

    if (!nickname || nickname.length < 2) {
      return NextResponse.json(
        { error: "In-game Name wajib diisi (minimal 2 karakter)." },
        { status: 400 }
      );
    }

    if (!discordTag || discordTag.length < 2) {
      return NextResponse.json(
        { error: "Discord Name wajib diisi untuk keperluan mention saat lelang." },
        { status: 400 }
      );
    }

    if (!itemTitle) {
      return NextResponse.json(
        { error: "Item lelang wajib dipilih." },
        { status: 400 }
      );
    }

    // Lookup matching item by ID or title
    let resolvedItemId = itemId || null;
    if (!resolvedItemId) {
      const match = await sql`
        SELECT id FROM auction_items
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(${itemTitle}))
        LIMIT 1;
      `;
      if (match.length > 0) {
        resolvedItemId = match[0].id;
      }
    }

    const signupId = `signup-${crypto.randomUUID()}`;

    await sql`
      INSERT INTO auction_signups (
        id, item_id, item_title, nickname, discord_tag, level, quantity, status
      ) VALUES (
        ${signupId},
        ${resolvedItemId},
        ${itemTitle},
        ${nickname},
        ${discordTag},
        ${level},
        ${quantity},
        'pending'
      );
    `;

    return NextResponse.json({
      ok: true,
      message: `Pendaftaran berhasil dikirim! Menunggu konfirmasi admin untuk masuk ke antrian ${itemTitle}.`,
      signupId,
    });
  } catch (err) {
    console.error("POST /api/lelang/signups error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengirim pendaftaran antrian." },
      { status: 500 }
    );
  }
}
