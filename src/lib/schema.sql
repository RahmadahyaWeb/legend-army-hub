-- Schema initialization for Legend Army Guild Hub (Neon Database / PostgreSQL)

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

CREATE TABLE IF NOT EXISTS guild_leagues (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  opponent VARCHAR(255) DEFAULT 'TBA',
  notes TEXT DEFAULT '',
  match_date TIMESTAMPTZ,
  status VARCHAR(32) DEFAULT 'draft',
  max_teams INT DEFAULT 2,
  members_per_team INT DEFAULT 10,
  max_roster INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS attendances (
  id VARCHAR(64) PRIMARY KEY,
  guild_league_id VARCHAR(64) REFERENCES guild_leagues(id) ON DELETE CASCADE,
  member_id VARCHAR(64) REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(32) DEFAULT 'present',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(128) DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_guild_leagues_match_date ON guild_leagues(match_date);
CREATE INDEX IF NOT EXISTS idx_gl_rosters_guild_league_id ON guild_league_rosters(guild_league_id);
CREATE INDEX IF NOT EXISTS idx_gl_teams_guild_league_id ON guild_league_teams(guild_league_id);

-- Valkyrie Cup Tournament Tables
-- Why this exists:
-- Persists team registrations and 8-player rosters for the Valkyrie Cup tournament,
-- allowing administrative approval workflows and public showcase of approved/pending lineups.
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

-- Partial index ensures active team names (pending and approved) are strictly unique,
-- while allowing previously rejected team names to be resubmitted.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vc_active_team_name 
  ON valkyrie_cup_registrations (LOWER(TRIM(team_name))) 
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_vc_registrations_status ON valkyrie_cup_registrations(status);
CREATE INDEX IF NOT EXISTS idx_vc_registrations_guild ON valkyrie_cup_registrations(guild);
CREATE INDEX IF NOT EXISTS idx_vc_registrations_user_id ON valkyrie_cup_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_vc_members_reg_id ON valkyrie_cup_members(valkyrie_cup_registration_id);

