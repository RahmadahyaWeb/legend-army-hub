import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Auction Item Catalog Handler
 *
 * Why this exists:
 * Manages the available auction catalog items (Card, Gear, Relic, etc.),
 * allowing leadership to introduce new boss drops or retire old items.
 *
 * @param {Request} request - Incoming HTTP request
 * @returns {Promise<NextResponse>} Result of item operation
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
      id,
      category = "card",
      title,
      hint = "",
      imageUrl = "",
      sortOrder = 0,
      isActive = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Item name is required." }, { status: 400 });
    }

    const isEdit = Boolean(id);
    const itemId = isEdit ? id : `item-${category}-${crypto.randomUUID().slice(0, 8)}`;

    if (isEdit) {
      await sql`
        UPDATE auction_items
        SET
          category = ${category},
          title = ${title.trim()},
          hint = ${hint.trim()},
          image_url = ${imageUrl.trim()},
          sort_order = ${parseInt(sortOrder, 10) || 0},
          is_active = ${Boolean(isActive)},
          updated_at = NOW()
        WHERE id = ${itemId};
      `;
    } else {
      await sql`
        INSERT INTO auction_items (
          id, category, title, hint, image_url, sort_order, is_active
        ) VALUES (
          ${itemId},
          ${category},
          ${title.trim()},
          ${hint.trim()},
          ${imageUrl.trim()},
          ${parseInt(sortOrder, 10) || 0},
          ${Boolean(isActive)}
        );
      `;
    }

    return NextResponse.json({
      ok: true,
      message: `Item "${title.trim()}" saved successfully.`,
      itemId,
    });
  } catch (err) {
    console.error("POST /api/admin/auction/items error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save auction item." },
      { status: 500 }
    );
  }
}

/**
 * Deletes an auction catalog item.
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
      return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
    }

    await sql`
      DELETE FROM auction_items
      WHERE id = ${id};
    `;

    return NextResponse.json({
      ok: true,
      message: "Auction item deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE /api/admin/auction/items error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete auction item." },
      { status: 500 }
    );
  }
}
