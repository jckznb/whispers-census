-- ============================================================
-- Migration 004: Add profession tracking
--
-- New tables:
--   professions          — reference table, seeded inline
--   character_professions — per-character profession snapshot
--
-- New RPC functions:
--   get_pvp_profession_stats(date, region)
--   get_mplus_profession_stats(date, region)
--
-- Run in Supabase dashboard SQL editor.
-- ============================================================

-- ---- Reference table ----------------------------------------

CREATE TABLE IF NOT EXISTS professions (
    id   INTEGER PRIMARY KEY,  -- Blizzard stable profession ID
    name TEXT    NOT NULL,
    type TEXT    NOT NULL      -- 'crafting' | 'gathering' | 'secondary'
);

ALTER TABLE professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON professions FOR SELECT USING (true);

-- Seed known professions (IDs are stable across regions and expansions)
INSERT INTO professions (id, name, type) VALUES
    (164, 'Blacksmithing',  'crafting'),
    (165, 'Leatherworking', 'crafting'),
    (171, 'Alchemy',        'crafting'),
    (182, 'Herbalism',      'gathering'),
    (185, 'Cooking',        'secondary'),
    (186, 'Mining',         'gathering'),
    (197, 'Tailoring',      'crafting'),
    (202, 'Engineering',    'crafting'),
    (333, 'Enchanting',     'crafting'),
    (356, 'Fishing',        'secondary'),
    (393, 'Skinning',       'gathering'),
    (755, 'Jewelcrafting',  'crafting'),
    (773, 'Inscription',    'crafting'),
    (794, 'Archaeology',    'secondary')
ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        type = EXCLUDED.type;

-- ---- Per-character profession data --------------------------

CREATE TABLE IF NOT EXISTS character_professions (
    id                  BIGSERIAL PRIMARY KEY,
    character_id        BIGINT  NOT NULL REFERENCES characters(id),
    profession_id       INTEGER NOT NULL REFERENCES professions(id),
    is_primary          BOOLEAN NOT NULL,  -- true = primary slot, false = secondary
    current_tier_name   TEXT,              -- e.g. "Khaz Algar Blacksmithing"
    current_tier_skill  INTEGER,           -- skill points in latest expansion tier
    current_tier_max    INTEGER,           -- max skill points in latest expansion tier
    snapshot_date       DATE    NOT NULL,
    UNIQUE (character_id, profession_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_charprof_character   ON character_professions (character_id);
CREATE INDEX IF NOT EXISTS idx_charprof_profession  ON character_professions (profession_id);
CREATE INDEX IF NOT EXISTS idx_charprof_primary     ON character_professions (is_primary);
CREATE INDEX IF NOT EXISTS idx_charprof_snapshot    ON character_professions (snapshot_date);

ALTER TABLE character_professions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON character_professions FOR SELECT USING (true);

-- ---- RPC: PvP profession distribution -----------------------

CREATE OR REPLACE FUNCTION get_pvp_profession_stats(
    p_snapshot_date DATE,
    p_region        TEXT
)
RETURNS TABLE (
    profession_id INTEGER,
    name          TEXT,
    type          TEXT,
    count         BIGINT,
    pct           NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET LOCAL statement_timeout = '120s';

    RETURN QUERY
    WITH context_chars AS (
        -- All distinct characters on PvP leaderboards for this snapshot + region
        SELECT DISTINCT pe.character_id
        FROM pvp_entries pe
        JOIN characters ch ON pe.character_id = ch.id
        WHERE pe.snapshot_date = p_snapshot_date
          AND ch.region         = p_region
    ),
    latest_profs AS (
        -- For each (character, profession) keep only the most recent snapshot
        SELECT DISTINCT ON (cp.character_id, cp.profession_id)
            cp.character_id,
            cp.profession_id
        FROM character_professions cp
        WHERE cp.character_id IN (SELECT character_id FROM context_chars)
          AND cp.is_primary     = true
          AND cp.snapshot_date <= p_snapshot_date
        ORDER BY cp.character_id, cp.profession_id, cp.snapshot_date DESC
    ),
    counts AS (
        SELECT
            lp.profession_id,
            COUNT(DISTINCT lp.character_id)::BIGINT AS char_count
        FROM latest_profs lp
        GROUP BY lp.profession_id
    ),
    total_chars AS (
        SELECT COUNT(*)::BIGINT AS total FROM context_chars
    )
    SELECT
        p.id,
        p.name,
        p.type,
        c.char_count,
        ROUND(c.char_count * 100.0 / NULLIF(t.total, 0), 2)
    FROM counts c
    JOIN professions p ON c.profession_id = p.id
    CROSS JOIN total_chars t
    ORDER BY c.char_count DESC;
END;
$$;

-- ---- RPC: M+ profession distribution ------------------------

CREATE OR REPLACE FUNCTION get_mplus_profession_stats(
    p_snapshot_date DATE,
    p_region        TEXT
)
RETURNS TABLE (
    profession_id INTEGER,
    name          TEXT,
    type          TEXT,
    count         BIGINT,
    pct           NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET LOCAL statement_timeout = '120s';

    RETURN QUERY
    WITH context_chars AS (
        -- All distinct characters who appeared in M+ runs for this snapshot + region
        SELECT DISTINCT mpm.character_id
        FROM mythic_plus_members mpm
        JOIN mythic_plus_runs    mpr ON mpm.run_id      = mpr.id
        JOIN characters          ch  ON mpm.character_id = ch.id
        WHERE mpr.snapshot_date = p_snapshot_date
          AND ch.region          = p_region
    ),
    latest_profs AS (
        SELECT DISTINCT ON (cp.character_id, cp.profession_id)
            cp.character_id,
            cp.profession_id
        FROM character_professions cp
        WHERE cp.character_id IN (SELECT character_id FROM context_chars)
          AND cp.is_primary     = true
          AND cp.snapshot_date <= p_snapshot_date
        ORDER BY cp.character_id, cp.profession_id, cp.snapshot_date DESC
    ),
    counts AS (
        SELECT
            lp.profession_id,
            COUNT(DISTINCT lp.character_id)::BIGINT AS char_count
        FROM latest_profs lp
        GROUP BY lp.profession_id
    ),
    total_chars AS (
        SELECT COUNT(*)::BIGINT AS total FROM context_chars
    )
    SELECT
        p.id,
        p.name,
        p.type,
        c.char_count,
        ROUND(c.char_count * 100.0 / NULLIF(t.total, 0), 2)
    FROM counts c
    JOIN professions p ON c.profession_id = p.id
    CROSS JOIN total_chars t
    ORDER BY c.char_count DESC;
END;
$$;
