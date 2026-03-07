-- Migration: Fix search RPCs, add inactive group detection, add site_settings
-- Date: 2026-03-07

-- ============================================================
-- 1. Fix existing fansub groups — ensure approved status
-- ============================================================
UPDATE fansub_groups
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

-- ============================================================
-- 2. Lower pg_trgm similarity threshold for better short-query matching
-- ============================================================
SELECT set_limit(0.1);
ALTER DATABASE postgres SET pg_trgm.similarity_threshold = 0.1;

-- ============================================================
-- 3. Update search_animes RPC — add LIKE-based fallback matching
-- ============================================================
CREATE OR REPLACE FUNCTION search_animes(search_query TEXT)
RETURNS TABLE (
  id               UUID,
  title_he         TEXT,
  title_en         TEXT,
  title_romaji     TEXT,
  cover_image_url  TEXT,
  genres           TEXT[],
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title_he,
    a.title_en,
    a.title_romaji,
    a.cover_image_url,
    a.genres,
    GREATEST(
      similarity(a.title_he,  search_query),
      similarity(a.title_en,  search_query),
      COALESCE(similarity(a.title_romaji, search_query), 0),
      CASE WHEN lower(a.title_he) LIKE '%' || lower(search_query) || '%' THEN 0.5 ELSE 0 END,
      CASE WHEN lower(a.title_en) LIKE '%' || lower(search_query) || '%' THEN 0.5 ELSE 0 END
    ) AS similarity_score
  FROM animes a
  WHERE
    a.title_he     % search_query
    OR a.title_en  % search_query
    OR a.title_romaji % search_query
    OR lower(a.title_he) LIKE '%' || lower(search_query) || '%'
    OR lower(a.title_en) LIKE '%' || lower(search_query) || '%'
  ORDER BY similarity_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 4. Update search_fansubs RPC — add LIKE-based fallback + status filter
-- ============================================================
CREATE OR REPLACE FUNCTION search_fansubs(search_query TEXT)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  logo_url          TEXT,
  description       TEXT,
  translation_count BIGINT,
  similarity_score  FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fg.id,
    fg.name,
    fg.logo_url,
    fg.description,
    COUNT(t.id) AS translation_count,
    GREATEST(
      similarity(fg.name, search_query),
      CASE WHEN lower(fg.name) LIKE '%' || lower(search_query) || '%'
           THEN 0.5 ELSE 0 END
    ) AS similarity_score
  FROM fansub_groups fg
  LEFT JOIN translations t ON t.fansub_id = fg.id
  WHERE
    fg.is_active = true
    AND fg.status = 'approved'
    AND (
      fg.name % search_query
      OR lower(fg.name) LIKE '%' || lower(search_query) || '%'
      OR lower(fg.name) LIKE lower(search_query) || '%'
    )
  GROUP BY fg.id
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 5. Create site_settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT         NOT NULL
);

INSERT INTO site_settings (key, value)
VALUES ('inactivity_threshold_months', '6')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Use is_admin() helper (defined in 20260306020000_fix_rls_policies.sql)
DROP POLICY IF EXISTS "settings_public_read" ON site_settings;
CREATE POLICY "settings_public_read" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON site_settings;
CREATE POLICY "settings_admin_write" ON site_settings
  FOR ALL USING (public.is_admin());

-- ============================================================
-- 6. Add activity_status column if missing (already added in earlier migration,
--    but this is idempotent just in case)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fansub_groups' AND column_name = 'activity_status'
  ) THEN
    ALTER TABLE fansub_groups
      ADD COLUMN activity_status VARCHAR(50) DEFAULT 'active'
      CHECK (activity_status IN ('active', 'on_break', 'inactive'));
  END IF;
END $$;

-- ============================================================
-- 7. Create update_inactive_groups RPC
-- ============================================================
CREATE OR REPLACE FUNCTION update_inactive_groups()
RETURNS INTEGER AS $$
DECLARE
  threshold_months INTEGER;
  updated_count INTEGER;
BEGIN
  SELECT value::INTEGER INTO threshold_months
  FROM site_settings
  WHERE key = 'inactivity_threshold_months';

  -- Mark groups as inactive if no translation updated in X months
  UPDATE fansub_groups fg
  SET activity_status = 'inactive'
  WHERE fg.is_active = true
    AND fg.activity_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM translations t
      WHERE t.fansub_id = fg.id
        AND t.updated_at > now() - (threshold_months || ' months')::INTERVAL
    )
    AND EXISTS (
      SELECT 1 FROM translations t WHERE t.fansub_id = fg.id
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
