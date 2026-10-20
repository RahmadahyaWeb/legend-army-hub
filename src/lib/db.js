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

  // Auction / Arena Bid Tables
  // Why this exists:
  // Stores auction items, queue slots, public queue signups, winners, and rules
  // for the live guild bidding system.
  await sql`
    CREATE TABLE IF NOT EXISTS auction_items (
      id VARCHAR(64) PRIMARY KEY,
      category VARCHAR(32) NOT NULL DEFAULT 'card',
      title VARCHAR(255) NOT NULL,
      hint VARCHAR(255) DEFAULT '',
      image_url VARCHAR(255) DEFAULT '',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auction_slots (
      id VARCHAR(64) PRIMARY KEY,
      item_id VARCHAR(64) NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
      slot_number INT NOT NULL,
      nickname VARCHAR(128) NOT NULL,
      discord_tag VARCHAR(128) DEFAULT '',
      level INT DEFAULT 100,
      note VARCHAR(255) DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_auction_item_slot UNIQUE (item_id, slot_number)
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auction_signups (
      id VARCHAR(64) PRIMARY KEY,
      item_id VARCHAR(64) REFERENCES auction_items(id) ON DELETE SET NULL,
      item_title VARCHAR(255) NOT NULL,
      nickname VARCHAR(128) NOT NULL,
      discord_tag VARCHAR(128) NOT NULL,
      level INT DEFAULT 100,
      quantity INT DEFAULT 1,
      status VARCHAR(32) DEFAULT 'pending',
      admin_notes TEXT DEFAULT '',
      assigned_slot INT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auction_winners (
      id VARCHAR(64) PRIMARY KEY,
      item_id VARCHAR(64) REFERENCES auction_items(id) ON DELETE SET NULL,
      item_title VARCHAR(255) NOT NULL,
      nickname VARCHAR(128) NOT NULL,
      note VARCHAR(255) DEFAULT '',
      won_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS auction_rules (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      lines JSONB NOT NULL DEFAULT '[]',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_auction_items_category ON auction_items(category);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auction_slots_item_id ON auction_slots(item_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auction_signups_status ON auction_signups(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auction_signups_created_at ON auction_signups(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_auction_winners_won_at ON auction_winners(won_at DESC);`;

  // Seed default auction items if table is empty
  // Why this exists:
  // Provides instant, rich data matching the guild's reference catalog upon initial setup.
  const existingItems = await sql`SELECT COUNT(*)::int as count FROM auction_items;`;
  if (existingItems[0]?.count === 0) {
    await seedDefaultAuctionData(sql);
  }

  return { success: true, message: "Database schema initialized successfully." };
}

/**
 * Seeds default Ragnarok / Legend Army auction items and rules.
 *
 * Why this exists:
 * Seeds authentic Guild Auction catalog items (Card & Gear) and procedure guidelines
 * so the arena is immediately usable and fully populated.
 *
 * @param {any} sql - Neon SQL instance
 * @returns {Promise<void>}
 */
async function seedDefaultAuctionData(sql) {
  const defaultItems = [
    // CARD category
    { id: "item-card-1", category: "card", title: "Orc Hero (Headwear)", hint: "MVP Card · Headwear", sort_order: 1 },
    { id: "item-card-2", category: "card", title: "Orc Leader (Headwear)", hint: "MVP Card · Headwear", sort_order: 2 },
    { id: "item-card-3", category: "card", title: "Dracula (Facewear)", hint: "MVP Card · Facewear", sort_order: 3 },
    { id: "item-card-4", category: "card", title: "Mistress (Backwear)", hint: "MVP Card · Backwear", sort_order: 4 },
    { id: "item-card-5", category: "card", title: "Angeling (Backwear)", hint: "Mini Card · Backwear", sort_order: 5 },
    { id: "item-card-6", category: "card", title: "Phreeoni (Mouthwear)", hint: "MVP Card · Mouthwear", sort_order: 6 },
    { id: "item-card-7", category: "card", title: "Osiris (Mouthwear)", hint: "MVP Card · Mouthwear", sort_order: 7 },

    // GEAR category
    { id: "item-gear-1", category: "gear", title: "Royal Eye of Dullahan", hint: "Accessory · MATK / INT", sort_order: 1 },
    { id: "item-gear-2", category: "gear", title: "Royal Safety Ring", hint: "Accessory · DEF / MDEF", sort_order: 2 },
    { id: "item-gear-3", category: "gear", title: "Royal Kind Heart", hint: "Accessory · Heal & HP Recovery", sort_order: 3 },
    { id: "item-gear-4", category: "gear", title: "Royal Nile Rose", hint: "Accessory · Ranged ATK", sort_order: 4 },
    { id: "item-gear-5", category: "gear", title: "Royal Baradium Brooch", hint: "Accessory · AGI / FLEE", sort_order: 5 },
    { id: "item-gear-6", category: "gear", title: "Royal Cold Heart", hint: "Accessory · Critical DMG", sort_order: 6 },
    { id: "item-gear-7", category: "gear", title: "Royal Golden Ball", hint: "Accessory · Physical ATK", sort_order: 7 },
    { id: "item-gear-8", category: "gear", title: "Royal Morrigane's Pendant", hint: "Accessory · LUK / Crit", sort_order: 8 },
    { id: "item-gear-9", category: "gear", title: "Royal Rogue's Treasure", hint: "Accessory · ASPD / ATK", sort_order: 9 },
    { id: "item-gear-10", category: "gear", title: "Royal Orleans Necklace", hint: "Accessory · Cast Time Reduction", sort_order: 10 },
    { id: "item-gear-11", category: "gear", title: "Royal Orleans Glove", hint: "Accessory · Magic Pen / MATK", sort_order: 11 },
    { id: "item-gear-12", category: "gear", title: "Royal Morrigane's Belt", hint: "Accessory · Crit Resistance", sort_order: 12 },
  ];

  for (const item of defaultItems) {
    await sql`
      INSERT INTO auction_items (id, category, title, hint, sort_order)
      VALUES (${item.id}, ${item.category}, ${item.title}, ${item.hint}, ${item.sort_order})
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // Seed default sample queue slots for realistic preview
  const defaultSlots = [
    { id: "slot-c1-1", item_id: "item-card-1", slot_number: 1, nickname: "ValkyraBeast", discord_tag: "valkyra.beast", level: 100, note: "Prio 1" },
    { id: "slot-c1-2", item_id: "item-card-1", slot_number: 2, nickname: "NightStalker", discord_tag: "night.stalker", level: 100, note: "" },
    { id: "slot-c3-1", item_id: "item-card-3", slot_number: 1, nickname: "ShadowKnight", discord_tag: "shadow.k", level: 100, note: "Ready" },
    { id: "slot-g1-1", item_id: "item-gear-1", slot_number: 1, nickname: "ArcaneMage", discord_tag: "arcane.m", level: 100, note: "Prio INT" },
    { id: "slot-g1-2", item_id: "item-gear-1", slot_number: 2, nickname: "FrostWeaver", discord_tag: "frost.w", level: 90, note: "" },
  ];

  for (const slot of defaultSlots) {
    await sql`
      INSERT INTO auction_slots (id, item_id, slot_number, nickname, discord_tag, level, note)
      VALUES (${slot.id}, ${slot.item_id}, ${slot.slot_number}, ${slot.nickname}, ${slot.discord_tag}, ${slot.level}, ${slot.note})
      ON CONFLICT (item_id, slot_number) DO NOTHING;
    `;
  }

  // Seed rules
  const defaultRules = [
    {
      id: "rule-1",
      title: "Prosedur Pendaftaran Antrian Lelang",
      sort_order: 1,
      lines: JSON.stringify([
        "Pilih item yang ingin Anda bid dari tab CARD atau GEAR, kemudian klik tombol '+ JOIN QUEUE'.",
        "Isi formulir dengan In-game Name (IGN) dan Discord Name (Username Discord yang aktif untuk mention).",
        "Pendaftaran Anda akan berstatus ⏳ PENDING menunggu verifikasi Admin Guild.",
        "Setelah disetujui (Approved), nama Anda otomatis masuk ke slot nomor antrian berikutnya pada item bersangkutan."
      ]),
    },
    {
      id: "rule-2",
      title: "Format Perintah Bid Mingguan di Discord",
      sort_order: 2,
      lines: JSON.stringify([
        "Gunakan perintah MauBid-NamaItem saat lelang dibuka di Discord channel #info-bid-mingguan.",
        "Gunakan perintah CancelBid-NamaItem jika ingin membatalkan antrian sebelum sesi lelang dimulai.",
        "Gunakan perintah SkipBid-NamaItem jika ingin melewati giliran tanpa kehilangan posisi antrian.",
        "Gunakan perintah DoneBid-NamaItem setelah transaksi lelang item berhasil diselesaikan."
      ]),
    },
    {
      id: "rule-3",
      title: "Ketentuan Slot Antrian & Eksekusi",
      sort_order: 3,
      lines: JSON.stringify([
        "Setiap item menampilkan slot antrian 1 sampai 10 secara terurut berdasarkan giliran antri.",
        "Slot #1 (👑 Leading) adalah pemain yang berhak mengambil item pertama kali saat item drop/tersedia.",
        "Setelah pemain Slot #1 dinyatakan menang (Won), nama mereka dicatat di daftar pemenang dan slot antrian di bawahnya akan naik satu tingkat."
      ]),
    },
    {
      id: "rule-4",
      title: "Sanksi Hit & Run / Pembatalan Mendadak",
      sort_order: 4,
      lines: JSON.stringify([
        "Pemain yang membatalkan bid saat giliran tiba tanpa konfirmasi sebelumnya akan dikenakan sanksi timeout antrian selama 2 minggu.",
        "Pastikan kecukupan Zeny atau alokasi DKP sebelum mendaftarkan diri pada antrian lelang."
      ]),
    },
  ];

  for (const rule of defaultRules) {
    await sql`
      INSERT INTO auction_rules (id, title, sort_order, lines)
      VALUES (${rule.id}, ${rule.title}, ${rule.sort_order}, ${rule.lines}::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `;
  }

  // Seed a sample winner
  await sql`
    INSERT INTO auction_winners (id, item_title, nickname, note, won_at)
    VALUES (
      'win-sample-1',
      'Dracula (Facewear)',
      'LordCommander',
      'Weekly Guild Raid',
      NOW() - INTERVAL '3 days'
    )
    ON CONFLICT (id) DO NOTHING;
  `;
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
