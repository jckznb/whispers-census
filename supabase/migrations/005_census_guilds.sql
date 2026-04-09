-- ============================================================
-- Migration 005: General population census infrastructure
--
-- Changes:
--   characters       — add guild_name, guild_realm_slug columns
--   census_guilds    — new table: discovered guilds + crawl queue
--   compute_general_demographics_snapshot — new aggregation RPC
--
-- Run in Supabase dashboard SQL editor.
-- ============================================================

-- ---- Extend characters table --------------------------------

ALTER TABLE characters ADD COLUMN IF NOT EXISTS guild_name      TEXT;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS guild_realm_slug TEXT;

-- Index for seeding census_guilds (characters with known guilds)
CREATE INDEX IF NOT EXISTS idx_characters_guild
    ON characters (guild_name, guild_realm_slug, region)
    WHERE guild_name IS NOT NULL;

-- ---- Guild crawl queue --------------------------------------

CREATE TABLE IF NOT EXISTS census_guilds (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,       -- proper name as returned by Blizzard API
    name_slug     TEXT NOT NULL,       -- URL-safe slug for roster API calls
    realm_slug    TEXT NOT NULL,
    region        TEXT NOT NULL,
    member_count  INTEGER,
    crawl_priority INTEGER DEFAULT 0,  -- higher = crawl sooner (reserved for future tuning)
    last_crawled_at TIMESTAMPTZ,       -- NULL = never crawled
    UNIQUE (name_slug, realm_slug, region)
);

CREATE INDEX IF NOT EXISTS idx_census_guilds_uncrawled
    ON census_guilds (region, last_crawled_at NULLS FIRST, crawl_priority DESC)
    WHERE last_crawled_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_census_guilds_stale
    ON census_guilds (region, last_crawled_at ASC)
    WHERE last_crawled_at IS NOT NULL;

ALTER TABLE census_guilds ENABLE ROW LEVEL SECURITY;
-- census_guilds is internal crawler data; no public read policy

-- ---- General population demographics aggregation RPC --------

CREATE OR REPLACE FUNCTION compute_general_demographics_snapshot(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_min_level     INTEGER DEFAULT 80
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET LOCAL statement_timeout = '120s';

    -- Remove previous general snapshot for this date + region so we can recompute
    DELETE FROM demographics_snapshot
    WHERE context = 'general'
      AND snapshot_date = p_snapshot_date
      AND region = p_region;

    INSERT INTO demographics_snapshot
        (snapshot_date, context, region, race_id, class_id, spec_id, gender, count, percentage)
    WITH counts AS (
        SELECT
            ch.race_id,
            ch.class_id,
            ch.active_spec_id  AS spec_id,
            ch.gender,
            COUNT(*)           AS count
        FROM characters ch
        WHERE ch.region = p_region
          AND ch.level  >= p_min_level
        GROUP BY ch.race_id, ch.class_id, ch.active_spec_id, ch.gender
    ),
    total AS (
        SELECT SUM(count) AS total FROM counts
    )
    SELECT
        p_snapshot_date,
        'general',
        p_region,
        c.race_id,
        c.class_id,
        c.spec_id,
        c.gender,
        c.count,
        ROUND(c.count * 100.0 / NULLIF(t.total, 0), 2)
    FROM counts c, total t
    WHERE c.race_id IS NOT NULL
      AND c.class_id IS NOT NULL;
END;
$$;
