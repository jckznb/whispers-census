-- ============================================================
-- Migration 008: Split general population by realm type (RP vs non-RP)
--
-- Changes:
--   compute_general_demographics_snapshot — add p_context and p_realm_slugs
--     params so callers can write separate snapshots for RP vs general realms.
--   characters — composite index for realm-filtered aggregation queries.
--
-- Backward compatible: existing calls with no new params still write
--   context='general' across all target realms unchanged.
-- ============================================================

-- Index for realm-filtered demographic aggregation
CREATE INDEX IF NOT EXISTS idx_characters_region_realm_level
    ON characters (region, realm_slug, level)
    WHERE level IS NOT NULL;

-- Recreate RPC with realm filter + configurable context name
CREATE OR REPLACE FUNCTION compute_general_demographics_snapshot(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_min_level     INTEGER DEFAULT 80,
    p_context       TEXT    DEFAULT 'general',
    p_realm_slugs   TEXT[]  DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300s'
AS $$
BEGIN
    -- Remove previous snapshot for this context/date/region before recomputing
    DELETE FROM demographics_snapshot
    WHERE context       = p_context
      AND snapshot_date = p_snapshot_date
      AND region        = p_region;

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
          AND (p_realm_slugs IS NULL OR ch.realm_slug = ANY(p_realm_slugs))
        GROUP BY ch.race_id, ch.class_id, ch.active_spec_id, ch.gender
    ),
    total AS (
        SELECT SUM(count) AS total FROM counts
    )
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
    FROM counts c, total t
    WHERE c.race_id  IS NOT NULL
      AND c.class_id IS NOT NULL;
END;
$$;
