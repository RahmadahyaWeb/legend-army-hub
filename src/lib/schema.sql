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

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_guild_leagues_match_date ON guild_leagues(match_date);
CREATE INDEX IF NOT EXISTS idx_gl_rosters_guild_league_id ON guild_league_rosters(guild_league_id);
CREATE INDEX IF NOT EXISTS idx_gl_teams_guild_league_id ON guild_league_teams(guild_league_id);
