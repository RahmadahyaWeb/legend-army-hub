import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin Endpoint: Reviews, approves, or rejects a Valkyrie Cup team registration.
 *
 * Why this exists:
 * Official review gate for tournament team submissions. Ensures every approval or rejection
 * is attributed to the reviewing administrator with an audit timestamp and optional feedback reason.
 *
 * Tricky logic:
 * Validates the current database state before modifying to prevent race conditions or double
 * reviews (e.g. if two administrators review the same submission concurrently).
 *
 * @param {Request} request - Incoming authenticated admin request with review payload
 * @param {Object} context - Route context params containing registration ID
 * @returns {Promise<NextResponse>} JSON response with updated registration record
 */
export async function POST(request, context) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, rejectionReason } = body || {};

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        { error: "Valid action ('approve' or 'reject') is required." },
        { status: 400 }
      );
    }

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // 1. Fetch current status to prevent race conditions or duplicate reviews
    const currentRows = await sql`
      SELECT id, team_name AS "teamName", status
      FROM valkyrie_cup_registrations
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (currentRows.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const currentReg = currentRows[0];
    const targetStatus = action === "approve" ? "approved" : "rejected";

    if (currentReg.status === targetStatus) {
      return NextResponse.json(
        {
          error: `Registration for "${currentReg.teamName}" is already ${targetStatus}.`,
        },
        { status: 409 }
      );
    }

    // Identify reviewing administrator
    const reviewerName = auth.displayName || auth.email || "Administrator";
    const cleanRejectionReason =
      action === "reject" ? (rejectionReason || "").trim() : "";

    // 2. Perform atomic status update
    const updatedRows = await sql`
      UPDATE valkyrie_cup_registrations
      SET 
        status = ${targetStatus},
        reviewed_by = ${reviewerName},
        reviewed_at = NOW(),
        rejection_reason = ${cleanRejectionReason},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING 
        id,
        user_id AS "userId",
        team_name AS "teamName",
        guild,
        status,
        reviewed_by AS "reviewedBy",
        reviewed_at AS "reviewedAt",
        rejection_reason AS "rejectionReason",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

    return NextResponse.json({
      success: true,
      message: `Registration for "${currentReg.teamName}" has been ${targetStatus}.`,
      registration: updatedRows[0],
    });
  } catch (error) {
    console.error("POST /api/admin/valkyrie-cup/registrations/[id]/review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process registration review" },
      { status: 500 }
    );
  }
}
