-- ============================================================
-- Migration 007: Talent build tracking
--
-- character_builds stores the active talent loadout code for each
-- character per snapshot. The code is the WoW export string
-- (base64-encoded) returned by /profile/wow/character/{realm}/{name}/specializations.
--
-- Decoding the string into individual talent choices is handled
-- client-side using WoW game data — we just store the raw string.
--
-- Run in Supabase dashboard SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS character_builds (
    id             BIGSERIAL PRIMARY KEY,
    character_id   BIGINT  NOT NULL REFERENCES characters(id),
    spec_id        INTEGER REFERENCES specs(id),
    loadout_code   TEXT    NOT NULL,
    snapshot_date  DATE    NOT NULL,
    UNIQUE (character_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_builds_character  ON character_builds (character_id);
CREATE INDEX IF NOT EXISTS idx_builds_spec        ON character_builds (spec_id);
CREATE INDEX IF NOT EXISTS idx_builds_snapshot    ON character_builds (snapshot_date);
CREATE INDEX IF NOT EXISTS idx_builds_spec_snap   ON character_builds (spec_id, snapshot_date);

ALTER TABLE character_builds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON character_builds FOR SELECT USING (true);

-- ---- RPC: top builds per spec in PvP context ----------------

CREATE OR REPLACE FUNCTION get_pvp_top_builds(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_limit         INTEGER DEFAULT 5
)
RETURNS TABLE (
    spec_id       INTEGER,
    spec_name     TEXT,
    class_name    TEXT,
    loadout_code  TEXT,
    count         BIGINT,
    pct           NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
BEGIN
    RETURN QUERY
    WITH context_chars AS (
        SELECT DISTINCT pe.character_id
        FROM pvp_entries pe
        JOIN characters ch ON pe.character_id = ch.id
        WHERE pe.snapshot_date = p_snapshot_date
          AND ch.region         = p_region
    ),
    spec_totals AS (
        SELECT ch.active_spec_id AS spec_id, COUNT(*) AS total
        FROM context_chars cc
        JOIN characters ch ON cc.character_id = ch.id
        WHERE ch.active_spec_id IS NOT NULL
        GROUP BY ch.active_spec_id
    ),
    build_counts AS (
        SELECT
            ch.active_spec_id  AS spec_id,
            cb.loadout_code,
            COUNT(*)           AS cnt
        FROM context_chars cc
        JOIN characters ch ON cc.character_id = ch.id
        JOIN character_builds cb ON cb.character_id = cc.character_id
            AND cb.snapshot_date <= p_snapshot_date
        WHERE ch.active_spec_id IS NOT NULL
          AND cb.loadout_code IS NOT NULL
        GROUP BY ch.active_spec_id, cb.loadout_code
    ),
    ranked AS (
        SELECT
            bc.spec_id,
            bc.loadout_code,
            bc.cnt,
            st.total,
            ROW_NUMBER() OVER (PARTITION BY bc.spec_id ORDER BY bc.cnt DESC) AS rn
        FROM build_counts bc
        JOIN spec_totals st ON st.spec_id = bc.spec_id
    )
    SELECT
        r.spec_id,
        s.name       AS spec_name,
        cl.name      AS class_name,
        r.loadout_code,
        r.cnt        AS count,
        ROUND(r.cnt * 100.0 / NULLIF(r.total, 0), 2) AS pct
    FROM ranked r
    JOIN specs   s  ON s.id  = r.spec_id
    JOIN classes cl ON cl.id = s.class_id
    WHERE r.rn <= p_limit
    ORDER BY r.spec_id, r.cnt DESC;
END;
$$;

-- ---- RPC: top builds per spec in M+ context -----------------

CREATE OR REPLACE FUNCTION get_mplus_top_builds(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_limit         INTEGER DEFAULT 5
)
RETURNS TABLE (
    spec_id       INTEGER,
    spec_name     TEXT,
    class_name    TEXT,
    loadout_code  TEXT,
    count         BIGINT,
    pct           NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '60s'
AS $$
BEGIN
    RETURN QUERY
    WITH context_chars AS (
        SELECT DISTINCT mpm.character_id
        FROM mythic_plus_members mpm
        JOIN mythic_plus_runs    mpr ON mpm.run_id       = mpr.id
        JOIN characters          ch  ON mpm.character_id = ch.id
        WHERE mpr.snapshot_date = p_snapshot_date
          AND ch.region          = p_region
    ),
    spec_totals AS (
        SELECT ch.active_spec_id AS spec_id, COUNT(*) AS total
        FROM context_chars cc
        JOIN characters ch ON cc.character_id = ch.id
        WHERE ch.active_spec_id IS NOT NULL
        GROUP BY ch.active_spec_id
    ),
    build_counts AS (
        SELECT
            ch.active_spec_id  AS spec_id,
            cb.loadout_code,
            COUNT(*)           AS cnt
        FROM context_chars cc
        JOIN characters ch ON cc.character_id = ch.id
        JOIN character_builds cb ON cb.character_id = cc.character_id
            AND cb.snapshot_date <= p_snapshot_date
        WHERE ch.active_spec_id IS NOT NULL
          AND cb.loadout_code IS NOT NULL
        GROUP BY ch.active_spec_id, cb.loadout_code
    ),
    ranked AS (
        SELECT
            bc.spec_id,
            bc.loadout_code,
            bc.cnt,
            st.total,
            ROW_NUMBER() OVER (PARTITION BY bc.spec_id ORDER BY bc.cnt DESC) AS rn
        FROM build_counts bc
        JOIN spec_totals st ON st.spec_id = bc.spec_id
    )
    SELECT
        r.spec_id,
        s.name       AS spec_name,
        cl.name      AS class_name,
        r.loadout_code,
        r.cnt        AS count,
        ROUND(r.cnt * 100.0 / NULLIF(r.total, 0), 2) AS pct
    FROM ranked r
    JOIN specs   s  ON s.id  = r.spec_id
    JOIN classes cl ON cl.id = s.class_id
    WHERE r.rn <= p_limit
    ORDER BY r.spec_id, r.cnt DESC;
END;
$$;
