import { neon } from "@neondatabase/serverless";

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    ""
  );
}

export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    return null;
  }
  return neon(url);
}

export async function query(sqlQuery, params = []) {
  const sql = getDb();
  if (!sql) {
    throw new Error(
      "DATABASE_URL is not configured. Please set DATABASE_URL or POSTGRES_URL in your environment variables."
    );
  }
  return await sql(sqlQuery, params);
}

export async function initDatabase() {
  const sql = getDb();
  if (!sql) {
    return { success: false, message: "DATABASE_URL not set" };
  }

  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(64) PRIMARY KEY,
      nickname VARCHAR(128) NOT NULL,
      class_name VARCHAR(64) NOT NULL,
      level INT DEFAULT 0,
      gear_score INT DEFAULT 0,
      role VARCHAR(64) DEFAULT 'Member',
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT DEFAULT '',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guild_leagues (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      opponent VARCHAR(255) DEFAULT 'TBA',
      notes TEXT DEFAULT '',
      match_date TIMESTAMPTZ,
      status VARCHAR(32) DEFAULT 'draft',
      event_type VARCHAR(32) DEFAULT 'guild_league',
      max_teams INT DEFAULT 2,
      members_per_team INT DEFAULT 10,
      max_roster INT DEFAULT 20,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Safely ensure event_type exists on existing tables
  await sql`
    ALTER TABLE guild_leagues ADD COLUMN IF NOT EXISTS event_type VARCHAR(32) DEFAULT 'guild_league';
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guild_league_teams (
      id VARCHAR(64) PRIMARY KEY,
      guild_league_id VARCHAR(64) NOT NULL REFERENCES guild_leagues(id) ON DELETE CASCADE,
      team_number INT NOT NULL,
      name VARCHAR(128) DEFAULT '',
      lane VARCHAR(128) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_gl_team UNIQUE (guild_league_id, team_number)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guild_league_rosters (
      id VARCHAR(64) PRIMARY KEY,
      guild_league_id VARCHAR(64) NOT NULL REFERENCES guild_leagues(id) ON DELETE CASCADE,
      member_id VARCHAR(64),
      nickname VARCHAR(128) NOT NULL,
      class_name VARCHAR(64) DEFAULT '',
      level INT DEFAULT 0,
      gear_score INT DEFAULT 0,
      team_number INT NOT NULL,
      slot_number INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_gl_roster_slot UNIQUE (guild_league_id, team_number, slot_number)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS strategies (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(64) DEFAULT 'General',
      content TEXT DEFAULT '',
      map_name VARCHAR(128) DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS attendances (
      id VARCHAR(64) PRIMARY KEY,
      guild_league_id VARCHAR(64) REFERENCES guild_leagues(id) ON DELETE CASCADE,
      member_id VARCHAR(64) REFERENCES members(id) ON DELETE CASCADE,
      status VARCHAR(32) DEFAULT 'present',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(128) DEFAULT 'Admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Valkyrie Cup Tournament Tables
  // Why this exists:
  // Stores tournament registration records, reviews, and 8-player team rosters
  // with normalized structure and cascade deletion when registrations are removed.
  await sql`
    CREATE TABLE IF NOT EXISTS valkyrie_cup_registrations (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      team_name VARCHAR(128) NOT NULL,
      guild VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(128),
      reviewed_at TIMESTAMPTZ,
      rejection_reason TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT chk_vc_guild CHECK (guild IN ('LegendArmy1', 'LegendArmy2')),
      CONSTRAINT chk_vc_status CHECK (status IN ('pending', 'approved', 'rejected'))
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS valkyrie_cup_members (
      id VARCHAR(64) PRIMARY KEY,
      valkyrie_cup_registration_id VARCHAR(64) NOT NULL REFERENCES valkyrie_cup_registrations(id) ON DELETE CASCADE,
      nickname VARCHAR(128) NOT NULL,
      discord_id VARCHAR(128) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT chk_vc_member_role CHECK (role IN ('captain', 'member'))
    );
  `;

  // Tricky logic: Partial unique index guarantees no duplicate team names among active (pending/approved) registrations,
  // while permitting a rejected team name to be re-registered later.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_vc_active_team_name 
      ON valkyrie_cup_registrations (LOWER(TRIM(team_name))) 
      WHERE status IN ('pending', 'approved');
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_vc_registrations_status ON valkyrie_cup_registrations(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_vc_registrations_guild ON valkyrie_cup_registrations(guild);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_vc_registrations_user_id ON valkyrie_cup_registrations(user_id);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_vc_members_reg_id ON valkyrie_cup_members(valkyrie_cup_registration_id);
  `;

  return { success: true, message: "Database schema initialized successfully." };
}

/**
 * Synchronizes guild event roster slots with current member profiles.
 *
 * Why this exists:
 * When member profiles are updated or re-imported (or after member data reset),
 * the roster slots in existing guild events must automatically reflect the
 * updated Gear Score, Class, and Level of each player, while re-linking
 * their member ID by case-insensitive nickname.
 *
 * Tricky logic:
 * Uses a subquery with DISTINCT ON (LOWER(TRIM(nickname))) to ensure that only
 * the most recently updated member record is selected in case of duplicate nicknames.
 *
 * @param {any} sql - Neon SQL client instance
 * @param {string|null} [guildLeagueId=null] - Optional ID to limit sync to one event
 * @returns {Promise<void>}
 */
export async function syncRosterWithMembers(sql, guildLeagueId = null) {
  if (!sql) return;
  try {
    if (guildLeagueId) {
      await sql`
        UPDATE guild_league_rosters glr
        SET 
          member_id = m.id,
          gear_score = m.gear_score,
          class_name = m.class_name,
          level = m.level,
          updated_at = NOW()
        FROM (
          SELECT DISTINCT ON (LOWER(TRIM(nickname)))
            id, nickname, class_name, level, gear_score
          FROM members
          ORDER BY LOWER(TRIM(nickname)), updated_at DESC, gear_score DESC
        ) m
        WHERE glr.guild_league_id = ${guildLeagueId}
          AND (
            (glr.member_id IS NOT NULL AND glr.member_id = m.id)
            OR LOWER(TRIM(glr.nickname)) = LOWER(TRIM(m.nickname))
          )
          AND (
            glr.gear_score IS DISTINCT FROM m.gear_score
            OR glr.class_name IS DISTINCT FROM m.class_name
            OR glr.level IS DISTINCT FROM m.level
            OR glr.member_id IS DISTINCT FROM m.id
          );
      `;
    } else {
      await sql`
        UPDATE guild_league_rosters glr
        SET 
          member_id = m.id,
          gear_score = m.gear_score,
          class_name = m.class_name,
          level = m.level,
          updated_at = NOW()
        FROM (
          SELECT DISTINCT ON (LOWER(TRIM(nickname)))
            id, nickname, class_name, level, gear_score
          FROM members
          ORDER BY LOWER(TRIM(nickname)), updated_at DESC, gear_score DESC
        ) m
        WHERE (
            (glr.member_id IS NOT NULL AND glr.member_id = m.id)
            OR LOWER(TRIM(glr.nickname)) = LOWER(TRIM(m.nickname))
          )
          AND (
            glr.gear_score IS DISTINCT FROM m.gear_score
            OR glr.class_name IS DISTINCT FROM m.class_name
            OR glr.level IS DISTINCT FROM m.level
            OR glr.member_id IS DISTINCT FROM m.id
          );
      `;
    }
  } catch (err) {
    console.error("syncRosterWithMembers error:", err);
  }
}
