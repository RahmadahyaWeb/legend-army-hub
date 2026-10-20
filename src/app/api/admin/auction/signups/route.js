import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Auction Signup Review Handler
 *
 * Why this exists:
 * Enables guild leaders to accept incoming member bids into the real-time slot queue,
 * or reject invalid requests with audit feedback.
 *
 * Tricky logic:
 * When approving, automatically calculates the next empty sequential slot number
 * (or reuses an open slot) if not manually designated by the admin, preventing
 * slot collisions on simultaneous approvals.
 *
 * @param {Request} request - Incoming HTTP POST/DELETE request
 * @returns {Promise<NextResponse>} Operation result
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
    const { signupId, action, adminNotes = "", designatedSlot } = body;

    if (!signupId || !action) {
      return NextResponse.json(
        { error: "Signup ID dan action ('approve' | 'reject') wajib disertakan." },
        { status: 400 }
      );
    }

    // Fetch the signup
    const signups = await sql`
      SELECT id, item_id, item_title, nickname, discord_tag, level, quantity, status
      FROM auction_signups
      WHERE id = ${signupId}
      LIMIT 1;
    `;

    if (signups.length === 0) {
      return NextResponse.json(
        { error: "Data pendaftaran tidak ditemukan." },
        { status: 404 }
      );
    }

    const signup = signups[0];

    if (action === "reject") {
      await sql`
        UPDATE auction_signups
        SET 
          status = 'rejected',
          admin_notes = ${adminNotes},
          updated_at = NOW()
        WHERE id = ${signupId};
      `;

      return NextResponse.json({
        ok: true,
        message: `Registration for "${signup.nickname}" was rejected.`,
      });
    }

    if (action === "approve") {
      // Resolve item
      let itemId = signup.item_id;
      if (!itemId) {
        const itemMatch = await sql`
          SELECT id FROM auction_items
          WHERE LOWER(TRIM(title)) = LOWER(TRIM(${signup.item_title}))
          LIMIT 1;
        `;
        if (itemMatch.length > 0) {
          itemId = itemMatch[0].id;
        } else {
          return NextResponse.json(
            { error: `Item "${signup.item_title}" is not registered in the catalog yet. Add the item first.` },
            { status: 400 }
          );
        }
      }

      // Determine slot number
      let slotNumber = designatedSlot ? parseInt(designatedSlot, 10) : null;
      if (!slotNumber || slotNumber < 1) {
        const highestSlot = await sql`
          SELECT COALESCE(MAX(slot_number), 0)::int AS max_slot
          FROM auction_slots
          WHERE item_id = ${itemId};
        `;
        slotNumber = (highestSlot[0]?.max_slot || 0) + 1;
      }

      const slotId = `slot-${crypto.randomUUID()}`;

      // Insert or replace slot
      await sql`
        INSERT INTO auction_slots (
          id, item_id, slot_number, nickname, discord_tag, level, note
        ) VALUES (
          ${slotId},
          ${itemId},
          ${slotNumber},
          ${signup.nickname},
          ${signup.discord_tag},
          ${signup.level},
          ${signup.quantity > 1 ? `${signup.quantity}x Slot` : ''}
        )
        ON CONFLICT (item_id, slot_number)
        DO UPDATE SET
          nickname = EXCLUDED.nickname,
          discord_tag = EXCLUDED.discord_tag,
          level = EXCLUDED.level,
          note = EXCLUDED.note,
          updated_at = NOW();
      `;

      // Update signup record
      await sql`
        UPDATE auction_signups
        SET 
          status = 'approved',
          assigned_slot = ${slotNumber},
          item_id = ${itemId},
          admin_notes = ${adminNotes},
          updated_at = NOW()
        WHERE id = ${signupId};
      `;

      return NextResponse.json({
        ok: true,
        message: `Registration for "${signup.nickname}" approved and placed in Slot #${slotNumber}!`,
        assignedSlot: slotNumber,
      });
    }

    return NextResponse.json(
      { error: "Unknown action. Choose 'approve' or 'reject'." },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/admin/auction/signups error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process registration." },
      { status: 500 }
    );
  }
}

/**
 * Deletes an auction signup entry.
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
      return NextResponse.json(
        { error: "Signup ID is required." },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM auction_signups
      WHERE id = ${id};
    `;

    return NextResponse.json({
      ok: true,
      message: "Registration deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/admin/auction/signups error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete registration." },
      { status: 500 }
    );
  }
}
