import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * Validates tournament registration payload according to Valkyrie Cup rules.
 *
 * Why this exists:
 * Enforces strict integrity rules before touching the database to ensure
 * clean team naming, guild exclusivity, and exact 8-player roster requirements.
 *
 * Tricky logic:
 * Performs case-insensitive uniqueness checks across all 8 player nicknames to prevent
 * duplicate roster entries in the same team.
 *
 * @param {Object} body - Parsed JSON request payload
 * @returns {string|null} Error string if validation fails, or null if valid
 */
function validateRegistrationPayload(body) {
  const { teamName, guild, captain, members } = body || {};

  if (!teamName || typeof teamName !== "string" || !teamName.trim()) {
    return "Team Name is required.";
  }

  if (teamName.trim().length < 2 || teamName.trim().length > 64) {
    return "Team Name must be between 2 and 64 characters.";
  }

  if (!guild || (guild !== "LegendArmy1" && guild !== "LegendArmy2")) {
    return "Guild must be selected from either 'LegendArmy1' or 'LegendArmy2'.";
  }

  if (!captain || typeof captain !== "object") {
    return "Captain information is required.";
  }

  const captainNick = (captain.nickname || "").trim();
  const captainDiscord = (captain.discordId || "").trim();

  if (!captainNick) {
    return "Captain Nickname is required.";
  }

  if (!captainDiscord) {
    return "Captain Discord ID is required.";
  }

  if (!Array.isArray(members) || members.length !== 7) {
    return "Exactly 7 team members must be provided (total 8 players including captain).";
  }

  // Validate each team member
  const allNicknames = [captainNick.toLowerCase()];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const nick = (member?.nickname || "").trim();
    const discordId = (member?.discordId || "").trim();

    if (!nick) {
      return `Member #${i + 1} Nickname is required.`;
    }

    if (!discordId) {
      return `Member #${i + 1} Discord ID is required.`;
    }

    const lowerNick = nick.toLowerCase();
    if (allNicknames.includes(lowerNick)) {
      return `Duplicate nickname "${nick}" detected. All players in the roster must have unique nicknames.`;
    }

    allNicknames.push(lowerNick);
  }

  if (allNicknames.length !== 8) {
    return "The team roster must consist of exactly 8 players.";
  }

  return null;
}

/**
 * Public Endpoint: Submits a new Valkyrie Cup team registration.
 *
 * Why this exists:
 * Handles incoming team signups, validates roster configuration, and creates
 * an initial `pending` registration record with an 8-member roster.
 *
 * Tricky logic:
 * Uses a single atomic batch/transaction to write the team registration and all 8 member records.
 * Issues a persistent `vc_user_id` session identifier cookie so the submitter can subsequently view
 * their registration and Discord IDs in the "My Registration" portal without requiring an admin login.
 *
 * @param {Request} request - Incoming POST request with team and member details
 * @returns {Promise<NextResponse>} JSON response indicating creation status and registration ID
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const validationError = validateRegistrationPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { teamName, guild, captain, members } = body;
    const cleanTeamName = teamName.trim();
    const cleanGuild = guild.trim();

    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    // 1. Check for duplicate team name among active (pending or approved) registrations
    const existingActive = await sql`
      SELECT id, team_name AS "teamName", status
      FROM valkyrie_cup_registrations
      WHERE LOWER(TRIM(team_name)) = LOWER(TRIM(${cleanTeamName}))
        AND status IN ('pending', 'approved')
      LIMIT 1;
    `;

    if (existingActive.length > 0) {
      return NextResponse.json(
        {
          error: `A team named "${cleanTeamName}" is already registered with status "${existingActive[0].status}". Please choose a different team name.`,
        },
        { status: 409 }
      );
    }

    // 2. Resolve submitter User ID
    const cookieStore = await cookies();
    const adminUser = await getSessionUser(request);
    let userId = null;

    if (adminUser?.id || adminUser?.email) {
      userId = adminUser.id || adminUser.email;
    } else {
      const existingClientUserId = cookieStore.get("vc_user_id")?.value;
      if (existingClientUserId) {
        userId = existingClientUserId;
      } else {
        userId = `usr_${crypto.randomUUID()}`;
      }
    }

    // 3. Prepare IDs for registration and roster members
    const registrationId = `vc_reg_${crypto.randomUUID()}`;
    const captainId = `vc_mem_${crypto.randomUUID()}`;

    const memberQueries = [];

    // Query 1: Insert registration
    memberQueries.push(
      sql`
        INSERT INTO valkyrie_cup_registrations (
          id,
          user_id,
          team_name,
          guild,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${registrationId},
          ${userId},
          ${cleanTeamName},
          ${cleanGuild},
          'pending',
          NOW(),
          NOW()
        );
      `
    );

    // Query 2: Insert Captain
    memberQueries.push(
      sql`
        INSERT INTO valkyrie_cup_members (
          id,
          valkyrie_cup_registration_id,
          nickname,
          discord_id,
          role,
          created_at,
          updated_at
        ) VALUES (
          ${captainId},
          ${registrationId},
          ${captain.nickname.trim()},
          ${captain.discordId.trim()},
          'captain',
          NOW(),
          NOW()
        );
      `
    );

    // Queries 3-9: Insert 7 Members
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const memId = `vc_mem_${crypto.randomUUID()}`;
      memberQueries.push(
        sql`
          INSERT INTO valkyrie_cup_members (
            id,
            valkyrie_cup_registration_id,
            nickname,
            discord_id,
            role,
            created_at,
            updated_at
          ) VALUES (
            ${memId},
            ${registrationId},
            ${m.nickname.trim()},
            ${m.discordId.trim()},
            'member',
            NOW(),
            NOW()
          );
        `
      );
    }

    // Execute atomic transaction
    await sql.transaction(memberQueries);

    // Set persistent user identification cookie
    cookieStore.set("vc_user_id", userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Team registration submitted successfully.",
      registrationId,
      userId,
      team: {
        id: registrationId,
        teamName: cleanTeamName,
        guild: cleanGuild,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("POST /api/valkyrie-cup/registrations error:", error);

    // Handle database unique constraint violation if triggered concurrently
    if (error.message?.includes("uq_vc_active_team_name")) {
      return NextResponse.json(
        { error: "A team with this name has already been registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to submit team registration." },
      { status: 500 }
    );
  }
}
