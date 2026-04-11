-- ============================================================
-- Migration 006: Fix compute_general_demographics_snapshot timeout
--
-- The previous version used SET LOCAL statement_timeout inside the
-- function body. This doesn't reliably override Supabase's session-level
-- statement_timeout (~8s), because the session GUC fires against the
-- top-level function call before the inner SET LOCAL can take effect.
--
-- The correct approach is to declare SET statement_timeout in the
-- CREATE FUNCTION signature. PostgreSQL applies this as part of the
-- function's execution context, overriding session-level settings from
-- the very start of the call.
--
-- Also adds a composite index on characters(region, level) to make
-- the demographics query fast regardless of table size.
--
-- Run in Supabase dashboard SQL editor.
-- ============================================================

-- ---- Composite index for the general demographics query -----

CREATE INDEX IF NOT EXISTS idx_characters_region_level
    ON characters (region, level)
    WHERE level IS NOT NULL;

-- ---- Recreate function with function-level timeout -----------

CREATE OR REPLACE FUNCTION compute_general_demographics_snapshot(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_min_level     INTEGER DEFAULT 80
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '300s'   -- function-level override; beats session GUC
AS $$
BEGIN
    -- Remove previous general snapshot for this date + region
    DELETE FROM demographics_snapshot
    WHERE context       = 'general'
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
    WHERE c.race_id  IS NOT NULL
      AND c.class_id IS NOT NULL;
END;
$$;
