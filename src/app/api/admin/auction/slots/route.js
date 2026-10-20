import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Queue Slot Management Handler
 *
 * Why this exists:
 * Allows guild officers to directly assign, modify, or vacate individual numbered
 * bidding slots on any item without needing a prior public web registration.
 *
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} Result of slot operation
 */
export async function POST(request) {
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

    const body = await request.json();
    const { itemId, slotNumber, nickname, discordTag = "", level = 100, note = "" } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
    }

    if (!slotNumber || slotNumber < 1) {
      return NextResponse.json({ error: "A valid slot number (>= 1) is required." }, { status: 400 });
    }

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: "Player character name is required." }, { status: 400 });
    }

    const slotId = `slot-${crypto.randomUUID()}`;

    await sql`
      INSERT INTO auction_slots (
        id, item_id, slot_number, nickname, discord_tag, level, note
      ) VALUES (
        ${slotId},
        ${itemId},
        ${slotNumber},
        ${nickname.trim()},
        ${discordTag.trim()},
        ${parseInt(level, 10) || 100},
        ${note.trim()}
      )
      ON CONFLICT (item_id, slot_number)
      DO UPDATE SET
        nickname = EXCLUDED.nickname,
        discord_tag = EXCLUDED.discord_tag,
        level = EXCLUDED.level,
        note = EXCLUDED.note,
        updated_at = NOW();
    `;

    return NextResponse.json({
      ok: true,
      message: `Slot #${slotNumber} updated successfully for ${nickname.trim()}.`,
    });
  } catch (err) {
    console.error("POST /api/admin/auction/slots error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update queue slot." },
      { status: 500 }
    );
  }
}

/**
 * Deletes a slot assignment.
 *
 * @param {Request} request - Incoming HTTP DELETE request
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const itemId = searchParams.get("itemId");
    const slotNumber = searchParams.get("slotNumber");

    if (id) {
      await sql`DELETE FROM auction_slots WHERE id = ${id};`;
    } else if (itemId && slotNumber) {
      await sql`
        DELETE FROM auction_slots
        WHERE item_id = ${itemId} AND slot_number = ${parseInt(slotNumber, 10)};
      `;
    } else {
      return NextResponse.json(
        { error: "Slot ID or both itemId and slotNumber are required." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Queue slot vacated successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/admin/auction/slots error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to vacate queue slot." },
      { status: 500 }
    );
  }
}
