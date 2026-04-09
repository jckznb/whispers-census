-- ============================================================
-- Migration 003: Increase statement_timeout for M+ aggregation
--
-- The compute_mplus_demographics_snapshot function previously used
-- SET LOCAL statement_timeout = '300s'. On a full fresh dataset
-- (~1.1M members) this can exceed 5 minutes, causing a 500 error
-- from the PostgREST RPC endpoint.
--
-- Bumped to 600s (10 min) to match the httpx client timeout.
-- Run in Supabase dashboard SQL editor.
-- ============================================================

CREATE OR REPLACE FUNCTION compute_mplus_demographics_snapshot(
    p_snapshot_date DATE,
    p_region        TEXT,
    p_min_keystone  INTEGER DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    SET LOCAL statement_timeout = '600s';

    DELETE FROM demographics_snapshot
    WHERE context      = 'mplus_all'
      AND snapshot_date = p_snapshot_date
      AND region        = p_region;

    INSERT INTO demographics_snapshot
        (snapshot_date, context, region, race_id, class_id, spec_id, gender, count, percentage)
    WITH unique_chars AS (
        SELECT DISTINCT ON (mpm.character_id)
            mpm.character_id,
            ch.race_id,
            s.class_id,
            mpm.spec_id,
            ch.gender
        FROM mythic_plus_members mpm
        JOIN mythic_plus_runs    mpr ON mpm.run_id        = mpr.id
        JOIN characters          ch  ON mpm.character_id  = ch.id
        JOIN specs               s   ON mpm.spec_id       = s.id
        WHERE mpr.snapshot_date    = p_snapshot_date
          AND ch.region            = p_region
          AND mpr.keystone_level  >= p_min_keystone
        ORDER BY mpm.character_id, mpr.keystone_level DESC
    ),
    counts AS (
        SELECT race_id, class_id, spec_id, gender, COUNT(*) AS count
        FROM unique_chars
        GROUP BY race_id, class_id, spec_id, gender
    ),
    total AS (SELECT SUM(count) AS total FROM counts)
    SELECT
        p_snapshot_date,
        'mplus_all',
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
