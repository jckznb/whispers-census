-- ============================================================
-- Whispers Census — Initial Schema
-- Run this in Supabase dashboard SQL editor or via CLI
-- ============================================================

-- ============================================================
-- Reference Tables (populated once from Blizzard Game Data API)
-- ============================================================

CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    faction TEXT NOT NULL  -- 'alliance', 'horde', 'neutral'
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS specs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    role TEXT NOT NULL  -- 'tank', 'healer', 'dps'
);

CREATE TABLE IF NOT EXISTS realms (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    connected_realm_id INTEGER,
    region TEXT NOT NULL  -- 'us', 'eu'
);

-- ============================================================
-- Core Character Table
-- ============================================================

CREATE TABLE IF NOT EXISTS characters (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    realm_slug TEXT NOT NULL,
    region TEXT NOT NULL,
    race_id INTEGER REFERENCES races(id),
    class_id INTEGER REFERENCES classes(id),
    active_spec_id INTEGER REFERENCES specs(id),
    gender INTEGER,  -- 0=male, 1=female
    level INTEGER,
    faction TEXT,
    equipped_item_level INTEGER,
    last_api_update TIMESTAMPTZ NOT NULL,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, realm_slug, region)
);

CREATE INDEX IF NOT EXISTS idx_characters_race ON characters(race_id);
CREATE INDEX IF NOT EXISTS idx_characters_class ON characters(class_id);
CREATE INDEX IF NOT EXISTS idx_characters_spec ON characters(active_spec_id);
CREATE INDEX IF NOT EXISTS idx_characters_level ON characters(level);
CREATE INDEX IF NOT EXISTS idx_characters_faction ON characters(faction);
CREATE INDEX IF NOT EXISTS idx_characters_region ON characters(region);

-- ============================================================
-- Phase 1: PvP Leaderboard Data
-- ============================================================

CREATE TABLE IF NOT EXISTS pvp_entries (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id),
    season_id INTEGER NOT NULL,
    bracket TEXT NOT NULL,  -- '2v2', '3v3', 'rbg', 'shuffle-warrior-arms', etc.
    rating INTEGER NOT NULL,
    rank INTEGER,
    snapshot_date DATE NOT NULL,
    UNIQUE(character_id, season_id, bracket, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_pvp_bracket ON pvp_entries(bracket);
CREATE INDEX IF NOT EXISTS idx_pvp_rating ON pvp_entries(rating);
CREATE INDEX IF NOT EXISTS idx_pvp_snapshot ON pvp_entries(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_pvp_season ON pvp_entries(season_id);

-- ============================================================
-- Phase 2: M+ and Raid Data
-- ============================================================

CREATE TABLE IF NOT EXISTS mythic_plus_runs (
    id BIGSERIAL PRIMARY KEY,
    dungeon_id INTEGER NOT NULL,
    dungeon_name TEXT,
    keystone_level INTEGER NOT NULL,
    completed_timestamp BIGINT,
    connected_realm_id INTEGER,
    period INTEGER NOT NULL,
    snapshot_date DATE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mplus_keystone ON mythic_plus_runs(keystone_level);
CREATE INDEX IF NOT EXISTS idx_mplus_dungeon ON mythic_plus_runs(dungeon_id);
CREATE INDEX IF NOT EXISTS idx_mplus_period ON mythic_plus_runs(period);

CREATE TABLE IF NOT EXISTS mythic_plus_members (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT REFERENCES mythic_plus_runs(id),
    character_id BIGINT REFERENCES characters(id),
    spec_id INTEGER REFERENCES specs(id)
);

CREATE TABLE IF NOT EXISTS raid_characters (
    id BIGSERIAL PRIMARY KEY,
    character_id BIGINT REFERENCES characters(id),
    raid_name TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    guild_name TEXT,
    guild_realm_slug TEXT,
    rank INTEGER,
    snapshot_date DATE NOT NULL
);

-- ============================================================
-- Phase 3: Census Crawl State
-- ============================================================

CREATE TABLE IF NOT EXISTS crawl_state (
    id BIGSERIAL PRIMARY KEY,
    realm_slug TEXT NOT NULL,
    region TEXT NOT NULL,
    last_auction_crawl TIMESTAMPTZ,
    last_guild_crawl TIMESTAMPTZ,
    guilds_discovered INTEGER DEFAULT 0,
    characters_discovered INTEGER DEFAULT 0,
    UNIQUE(realm_slug, region)
);

-- ============================================================
-- Precomputed Demographics Snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS demographics_snapshot (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    context TEXT NOT NULL,
    context_filter TEXT,
    region TEXT NOT NULL,
    race_id INTEGER REFERENCES races(id),
    class_id INTEGER REFERENCES classes(id),
    spec_id INTEGER REFERENCES specs(id),
    gender INTEGER,
    count INTEGER NOT NULL,
    percentage NUMERIC(5,2)
);

CREATE INDEX IF NOT EXISTS idx_demo_context ON demographics_snapshot(context, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_demo_region ON demographics_snapshot(region);
CREATE INDEX IF NOT EXISTS idx_demo_date ON demographics_snapshot(snapshot_date);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE realms ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pvp_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mythic_plus_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mythic_plus_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE raid_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographics_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_state ENABLE ROW LEVEL SECURITY;

-- Public read on all data tables
CREATE POLICY "Public read" ON races FOR SELECT USING (true);
CREATE POLICY "Public read" ON classes FOR SELECT USING (true);
CREATE POLICY "Public read" ON specs FOR SELECT USING (true);
CREATE POLICY "Public read" ON realms FOR SELECT USING (true);
CREATE POLICY "Public read" ON characters FOR SELECT USING (true);
CREATE POLICY "Public read" ON pvp_entries FOR SELECT USING (true);
CREATE POLICY "Public read" ON mythic_plus_runs FOR SELECT USING (true);
CREATE POLICY "Public read" ON mythic_plus_members FOR SELECT USING (true);
CREATE POLICY "Public read" ON raid_characters FOR SELECT USING (true);
CREATE POLICY "Public read" ON demographics_snapshot FOR SELECT USING (true);
-- crawl_state: no public access (internal crawler only)

-- ============================================================
-- Helper Functions (called via Supabase RPC)
-- ============================================================

-- Recompute demographics snapshot for a given context/bracket/season/date/region.
-- bracket_pattern uses LIKE syntax: '2v2' (exact), 'shuffle%' (prefix), NULL (all brackets).
CREATE OR REPLACE FUNCTION compute_demographics_snapshot(
    p_context TEXT,
    p_bracket_pattern TEXT,
    p_season_id INTEGER,
    p_snapshot_date DATE,
    p_region TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM demographics_snapshot
    WHERE context = p_context
      AND snapshot_date = p_snapshot_date
      AND region = p_region;

    INSERT INTO demographics_snapshot
        (snapshot_date, context, region, race_id, class_id, spec_id, gender, count, percentage)
    WITH counts AS (
        SELECT
            ch.race_id,
            ch.class_id,
            ch.active_spec_id AS spec_id,
            ch.gender,
            COUNT(*) AS count
        FROM pvp_entries pe
        JOIN characters ch ON pe.character_id = ch.id
        WHERE pe.season_id = p_season_id
          AND pe.snapshot_date = p_snapshot_date
          AND ch.region = p_region
          AND (
              p_bracket_pattern IS NULL
              OR pe.bracket LIKE p_bracket_pattern
          )
        GROUP BY ch.race_id, ch.class_id, ch.active_spec_id, ch.gender
    ),
    total AS (SELECT SUM(count) AS total FROM counts)
    SELECT
        p_snapshot_date,
        p_context,
        p_region,
        c.race_id,
        c.class_id,
        c.spec_id,
        c.gender,
        c.count,
        ROUND(c.count * 100.0 / NULLIF(t.total, 0), 2)
    FROM counts c, total t;
END;
$$;

-- Dynamic PvP demographics query (for frontend complex filters)
CREATE OR REPLACE FUNCTION get_pvp_demographics(
    p_bracket TEXT DEFAULT NULL,
    p_min_rating INTEGER DEFAULT 0,
    p_region TEXT DEFAULT 'all'
)
RETURNS TABLE (
    race_name TEXT,
    class_name TEXT,
    spec_name TEXT,
    race_faction TEXT,
    spec_role TEXT,
    char_count BIGINT,
    pct NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        r.name AS race_name,
        cl.name AS class_name,
        s.name AS spec_name,
        r.faction AS race_faction,
        s.role AS spec_role,
        COUNT(*) AS char_count,
        ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS pct
    FROM pvp_entries pe
    JOIN characters ch ON pe.character_id = ch.id
    JOIN races r ON ch.race_id = r.id
    JOIN classes cl ON ch.class_id = cl.id
    LEFT JOIN specs s ON ch.active_spec_id = s.id
    WHERE pe.rating >= p_min_rating
      AND (p_bracket IS NULL OR pe.bracket = p_bracket)
      AND (p_region = 'all' OR ch.region = p_region)
      AND pe.snapshot_date = (SELECT MAX(snapshot_date) FROM pvp_entries)
    GROUP BY r.name, cl.name, s.name, r.faction, s.role
    ORDER BY char_count DESC;
$$;
