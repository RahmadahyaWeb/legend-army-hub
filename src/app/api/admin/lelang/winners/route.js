import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Auction Winners Handler
 *
 * Why this exists:
 * Records successful auction executions, archiving the winner's nickname,
 * item won, and timestamp, with optional automatic clearing of the winner's slot.
 *
 * Tricky logic:
 * If vacateSlot is true, deletes the winning slot and shifts remaining queued slots
 * up by 1 position (e.g., slot 2 becomes slot 1, slot 3 becomes slot 2), maintaining
 * clean queue ordering.
 *
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} Result of winner logging
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
    const {
      itemId,
      itemTitle,
      nickname,
      note = "",
      wonAt,
      vacateSlotNumber,
    } = body;

    if (!itemTitle || !itemTitle.trim()) {
      return NextResponse.json({ error: "Item title is required." }, { status: 400 });
    }

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: "Winner character name is required." }, { status: 400 });
    }

    const winnerId = `win-${crypto.randomUUID()}`;

    await sql`
      INSERT INTO auction_winners (
        id, item_id, item_title, nickname, note, won_at
      ) VALUES (
        ${winnerId},
        ${itemId || null},
        ${itemTitle.trim()},
        ${nickname.trim()},
        ${note.trim()},
        ${wonAt ? new Date(wonAt) : new Date()}
      );
    `;

    // Optionally vacate the slot and shift up
    if (itemId && vacateSlotNumber) {
      const slotNum = parseInt(vacateSlotNumber, 10);
      await sql`
        DELETE FROM auction_slots
        WHERE item_id = ${itemId} AND slot_number = ${slotNum};
      `;

      // Shift subsequent slots up by 1
      await sql`
        UPDATE auction_slots
        SET slot_number = slot_number - 1, updated_at = NOW()
        WHERE item_id = ${itemId} AND slot_number > ${slotNum};
      `;
    }

    return NextResponse.json({
      ok: true,
      message: `Winner "${nickname.trim()}" for "${itemTitle.trim()}" recorded successfully!`,
      winnerId,
    });
  } catch (err) {
    console.error("POST /api/admin/lelang/winners error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record auction winner." },
      { status: 500 }
    );
  }
}

/**
 * Deletes a recorded winner.
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

    if (!id) {
      return NextResponse.json({ error: "Winner ID is required." }, { status: 400 });
    }

    await sql`
      DELETE FROM auction_winners
      WHERE id = ${id};
    `;

    return NextResponse.json({
      ok: true,
      message: "Auction winner record deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/admin/lelang/winners error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete winner record." },
      { status: 500 }
    );
  }
}
