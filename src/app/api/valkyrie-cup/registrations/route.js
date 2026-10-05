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

  if (!Array.isArray(members)) {
    return "Team members list is required.";
  }

  // Filter filled members while ensuring partial entries (e.g. nickname without Discord ID) are caught
  const filledMembers = [];
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const nick = (member?.nickname || "").trim();
    const discordId = (member?.discordId || "").trim();

    // If neither is filled, skip (for optional slots 5, 6, 7)
    if (!nick && !discordId) {
      // If index is within the mandatory first 4 members, require it
      if (i < 4) {
        return `Member #${i + 1} is required (minimum 5 total players including Captain).`;
      }
      continue;
    }

    if (!nick) {
      return `Member #${i + 1} Nickname is required when Discord ID is provided.`;
    }

    if (!discordId) {
      return `Member #${i + 1} Discord ID is required when Nickname is provided.`;
    }

    filledMembers.push({ index: i, nickname: nick, discordId });
  }

  // Enforce 1 Captain + 4 to 7 Members (Total 5 to 8 players)
  if (filledMembers.length < 4) {
    return "At least 4 team members are required (minimum 5 total players including Captain).";
  }

  if (filledMembers.length > 7) {
    return "A maximum of 7 team members is allowed (maximum 8 total players including Captain).";
  }

  // Validate nickname uniqueness across Captain and all filled members
  const allNicknames = [captainNick.toLowerCase()];

  for (const m of filledMembers) {
    const lowerNick = m.nickname.toLowerCase();
    if (allNicknames.includes(lowerNick)) {
      return `Duplicate nickname "${m.nickname}" detected. All players in the roster must have unique nicknames.`;
    }
    allNicknames.push(lowerNick);
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

    // Queries for Members (minimum 4, maximum 7)
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const nick = (m?.nickname || "").trim();
      const discordId = (m?.discordId || "").trim();

      // Skip empty optional member slots
      if (!nick && !discordId) continue;

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
            ${nick},
            ${discordId},
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
