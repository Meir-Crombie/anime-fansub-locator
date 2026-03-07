-- ============================================================
-- COMPLETE DATABASE SETUP — Israeli Anime Fansub Hub
-- ============================================================
-- This file is fully IDEMPOTENT — safe to run multiple times.
-- Run in Supabase Dashboard → SQL Editor.
-- ============================================================

-- ============================================================
-- 0. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Lower trigram threshold for short Hebrew/English queries
SELECT set_limit(0.1);

-- ============================================================
-- 1. ENUMs (idempotent create)
-- ============================================================
DO $$ BEGIN CREATE TYPE translation_status   AS ENUM ('ongoing', 'completed', 'dropped');         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE translation_platform AS ENUM ('website', 'telegram', 'discord', 'youtube'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE fansub_status        AS ENUM ('pending', 'approved', 'rejected');           EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE announcement_type    AS ENUM ('episode_release', 'new_project', 'completed', 'general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 2. Helper function — is_admin() (SECURITY DEFINER avoids RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. Tables
-- ============================================================

-- 3a. animes
CREATE TABLE IF NOT EXISTS animes (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_he        VARCHAR(255) NOT NULL,
  title_en        VARCHAR(255) NOT NULL,
  title_romaji    VARCHAR(255),
  synopsis        TEXT,
  cover_image_url VARCHAR(512),
  genres          TEXT[]       NOT NULL DEFAULT '{}',
  mal_id          INTEGER,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 3b. profiles
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         VARCHAR(50)  NOT NULL DEFAULT 'viewer',
  display_name VARCHAR(255),
  first_name   VARCHAR(100),
  age          INTEGER      CHECK (age IS NULL OR age >= 13)
);

-- 3c. fansub_groups
CREATE TABLE IF NOT EXISTS fansub_groups (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(255) NOT NULL UNIQUE,
  description         TEXT,
  website_url         VARCHAR(512),
  telegram_url        VARCHAR(512),
  discord_url         VARCHAR(512),
  logo_url            VARCHAR(512),
  manager_uid         UUID         REFERENCES auth.users(id),
  is_active           BOOLEAN      NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Add columns that may be missing (idempotent)
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS status             fansub_status NOT NULL DEFAULT 'approved';
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS established_year   INTEGER;
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS activity_status    VARCHAR(50) NOT NULL DEFAULT 'active';
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS translation_domains TEXT[]     NOT NULL DEFAULT '{}';
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS flagship_projects  TEXT;
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS is_recruiting      BOOLEAN    NOT NULL DEFAULT false;
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS recruiting_roles   TEXT[]     NOT NULL DEFAULT '{}';
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS recruitment_contact TEXT;
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS submitter_name     VARCHAR(255);
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS submitter_role     VARCHAR(255);
ALTER TABLE fansub_groups ADD COLUMN IF NOT EXISTS submitter_contact  VARCHAR(255);

-- Check constraint for activity_status (add only if missing)
DO $$ BEGIN
  ALTER TABLE fansub_groups ADD CONSTRAINT fansub_activity_status_check
    CHECK (activity_status IN ('active', 'on_break', 'inactive'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Check constraint for established_year (add only if missing)
DO $$ BEGIN
  ALTER TABLE fansub_groups ADD CONSTRAINT fansub_established_year_range
    CHECK (established_year IS NULL OR (established_year >= 1990 AND established_year <= 2100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure all existing fansub_groups have status = 'approved'
UPDATE fansub_groups SET status = 'approved' WHERE status IS NULL;

-- 3d. translations
CREATE TABLE IF NOT EXISTS translations (
  id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_id    UUID                NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
  fansub_id   UUID                NOT NULL REFERENCES fansub_groups(id) ON DELETE CASCADE,
  status      translation_status  NOT NULL,
  platform    translation_platform NOT NULL,
  direct_link VARCHAR(512)        NOT NULL,
  notes       TEXT,
  updated_at  TIMESTAMPTZ         NOT NULL DEFAULT now(),
  UNIQUE (anime_id, fansub_id, platform)
);

-- 3e. episode_progress
CREATE TABLE IF NOT EXISTS episode_progress (
  id                   UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  translation_id       UUID    NOT NULL UNIQUE REFERENCES translations(id) ON DELETE CASCADE,
  total_episodes       INTEGER,
  translated_episodes  INTEGER NOT NULL DEFAULT 0,
  last_episode_at      TIMESTAMPTZ
);

-- 3f. search_analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  query_string  VARCHAR(500) PRIMARY KEY,
  search_count  INTEGER      NOT NULL DEFAULT 1,
  last_searched TIMESTAMPTZ  NOT NULL DEFAULT now(),
  resolved      BOOLEAN      NOT NULL DEFAULT false
);

-- 3g. ratings
CREATE TABLE IF NOT EXISTS ratings (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  fansub_id  UUID        NOT NULL REFERENCES fansub_groups(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id),
  score      INTEGER     NOT NULL CHECK (score >= 1 AND score <= 5),
  review     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fansub_id, user_id)
);

-- 3h. announcements
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  fansub_id    UUID              NOT NULL REFERENCES fansub_groups(id) ON DELETE CASCADE,
  anime_id     UUID              REFERENCES animes(id),
  title        VARCHAR(255)      NOT NULL,
  content      TEXT              NOT NULL,
  type         announcement_type NOT NULL DEFAULT 'general',
  is_published BOOLEAN           NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- 3i. fansub_applications
CREATE TABLE IF NOT EXISTS fansub_applications (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by UUID         REFERENCES auth.users(id),
  form_data    JSONB        NOT NULL DEFAULT '{}',
  status       fansub_status NOT NULL DEFAULT 'pending',
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  UUID         REFERENCES auth.users(id)
);

-- 3j. form_fields
CREATE TABLE IF NOT EXISTS form_fields (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_name      VARCHAR(100) NOT NULL,
  field_key      VARCHAR(100) NOT NULL,
  field_label_he VARCHAR(255) NOT NULL,
  field_label_en VARCHAR(255) NOT NULL,
  field_type     VARCHAR(50)  NOT NULL,
  is_required    BOOLEAN      NOT NULL DEFAULT false,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  options        JSONB,
  placeholder_he VARCHAR(255)
);

-- 3k. site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  key   VARCHAR(100) PRIMARY KEY,
  value TEXT         NOT NULL
);

INSERT INTO site_settings (key, value) VALUES ('inactivity_threshold_months', '6')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 4. Trigram Indexes for search performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_animes_title_he_trgm  ON animes  USING gin (title_he  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_animes_title_en_trgm  ON animes  USING gin (title_en  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_animes_title_rom_trgm ON animes  USING gin (title_romaji gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fansubs_name_trgm     ON fansub_groups USING gin (name gin_trgm_ops);

-- ============================================================
-- 5. Trigger: auto-update updated_at on animes
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_animes_updated_at ON animes;
CREATE TRIGGER set_animes_updated_at
  BEFORE UPDATE ON animes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. Trigger: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name, first_name)
  VALUES (
    NEW.id,
    'viewer',
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. RLS Policies (all tables)
-- ============================================================

-- 7a. animes
ALTER TABLE animes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_animes" ON animes;
CREATE POLICY "public_read_animes" ON animes FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_write_animes" ON animes;
CREATE POLICY "admin_write_animes" ON animes FOR ALL USING (public.is_admin());

-- 7b. fansub_groups
ALTER TABLE fansub_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_fansubs" ON fansub_groups;
CREATE POLICY "public_read_fansubs" ON fansub_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "manager_update_own" ON fansub_groups;
CREATE POLICY "manager_update_own" ON fansub_groups FOR UPDATE USING (manager_uid = auth.uid());
DROP POLICY IF EXISTS "admin_all_fansubs" ON fansub_groups;
CREATE POLICY "admin_all_fansubs" ON fansub_groups FOR ALL USING (public.is_admin());

-- 7c. translations
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_translations" ON translations;
CREATE POLICY "public_read_translations" ON translations FOR SELECT USING (true);
DROP POLICY IF EXISTS "manager_write_translations" ON translations;
CREATE POLICY "manager_write_translations" ON translations FOR ALL
  USING (
    (SELECT manager_uid FROM fansub_groups WHERE id = translations.fansub_id) = auth.uid()
    OR public.is_admin()
  );

-- 7d. profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
CREATE POLICY "admin_all_profiles" ON profiles FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- 7e. search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_search_analytics" ON search_analytics;
CREATE POLICY "public_read_search_analytics" ON search_analytics FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_upsert_search_analytics" ON search_analytics;
CREATE POLICY "public_upsert_search_analytics" ON search_analytics FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_search_analytics" ON search_analytics;
CREATE POLICY "public_update_search_analytics" ON search_analytics FOR UPDATE USING (true);
DROP POLICY IF EXISTS "admin_all_search_analytics" ON search_analytics;
CREATE POLICY "admin_all_search_analytics" ON search_analytics FOR ALL USING (public.is_admin());

-- 7f. ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_ratings" ON ratings;
CREATE POLICY "public_read_ratings" ON ratings FOR SELECT USING (true);
DROP POLICY IF EXISTS "users_manage_own_ratings" ON ratings;
CREATE POLICY "users_manage_own_ratings" ON ratings FOR ALL USING (user_id = auth.uid());

-- 7g. announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_announcements" ON announcements;
CREATE POLICY "public_read_announcements" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "manager_write_announcements" ON announcements;
CREATE POLICY "manager_write_announcements" ON announcements FOR ALL
  USING (
    (SELECT manager_uid FROM fansub_groups WHERE id = announcements.fansub_id) = auth.uid()
    OR public.is_admin()
  );

-- 7h. episode_progress
ALTER TABLE episode_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_progress" ON episode_progress;
CREATE POLICY "public_read_progress" ON episode_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "manager_write_progress" ON episode_progress;
CREATE POLICY "manager_write_progress" ON episode_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM translations t
      JOIN fansub_groups fg ON fg.id = t.fansub_id
      WHERE t.id = episode_progress.translation_id
        AND (fg.manager_uid = auth.uid() OR public.is_admin())
    )
  );

-- 7i. fansub_applications
ALTER TABLE fansub_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_insert_applications" ON fansub_applications;
CREATE POLICY "users_insert_applications" ON fansub_applications
  FOR INSERT WITH CHECK (submitted_by = auth.uid());
DROP POLICY IF EXISTS "users_read_own_applications" ON fansub_applications;
CREATE POLICY "users_read_own_applications" ON fansub_applications
  FOR SELECT USING (submitted_by = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "admin_all_applications" ON fansub_applications;
CREATE POLICY "admin_all_applications" ON fansub_applications
  FOR ALL USING (public.is_admin());

-- 7j. form_fields
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_form_fields" ON form_fields;
CREATE POLICY "public_read_form_fields" ON form_fields FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_manage_form_fields" ON form_fields;
CREATE POLICY "admin_manage_form_fields" ON form_fields FOR ALL USING (public.is_admin());

-- 7k. site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read" ON site_settings;
CREATE POLICY "settings_public_read" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON site_settings;
CREATE POLICY "settings_admin_write" ON site_settings FOR ALL USING (public.is_admin());

-- ============================================================
-- 8. RPC Functions
-- ============================================================

-- 8a. search_animes — trigram + LIKE fallback
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
      CASE WHEN lower(a.title_en) LIKE '%' || lower(search_query) || '%' THEN 0.5 ELSE 0 END,
      CASE WHEN a.title_romaji IS NOT NULL AND lower(a.title_romaji) LIKE '%' || lower(search_query) || '%' THEN 0.5 ELSE 0 END
    ) AS similarity_score
  FROM animes a
  WHERE
    a.title_he     % search_query
    OR a.title_en  % search_query
    OR a.title_romaji % search_query
    OR lower(a.title_he) LIKE '%' || lower(search_query) || '%'
    OR lower(a.title_en) LIKE '%' || lower(search_query) || '%'
    OR (a.title_romaji IS NOT NULL AND lower(a.title_romaji) LIKE '%' || lower(search_query) || '%')
  ORDER BY similarity_score DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 8b. search_fansubs — trigram + LIKE fallback
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

-- 8c. increment_search_count
CREATE OR REPLACE FUNCTION increment_search_count(p_query TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (query_string, search_count, last_searched)
  VALUES (lower(trim(p_query)), 1, now())
  ON CONFLICT (query_string)
  DO UPDATE SET
    search_count = search_analytics.search_count + 1,
    last_searched = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8d. get_all_genres
CREATE OR REPLACE FUNCTION get_all_genres()
RETURNS TABLE (genre TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(a.genres) AS genre
  FROM animes a
  ORDER BY genre;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8e. get_random_anime (simple, no filters)
CREATE OR REPLACE FUNCTION get_random_anime()
RETURNS TABLE (id UUID, title_he TEXT, title_en TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title_he, a.title_en
  FROM animes a
  ORDER BY random()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 8f. get_random_anime_filtered (with optional filters)
CREATE OR REPLACE FUNCTION get_random_anime_filtered(
  p_genres     TEXT[]  DEFAULT NULL,
  p_min_ep     INTEGER DEFAULT NULL,
  p_max_ep     INTEGER DEFAULT NULL,
  p_min_season INTEGER DEFAULT NULL,
  p_max_season INTEGER DEFAULT NULL
)
RETURNS TABLE (id UUID, title_he TEXT, title_en TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title_he, a.title_en
  FROM animes a
  WHERE
    (p_genres IS NULL OR a.genres && p_genres)
  ORDER BY random()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 8g. get_similar_searches
CREATE OR REPLACE FUNCTION get_similar_searches(
  p_query     TEXT,
  p_threshold FLOAT DEFAULT 0.1
)
RETURNS TABLE (
  query_string     TEXT,
  search_count     INTEGER,
  last_searched    TIMESTAMPTZ,
  resolved         BOOLEAN,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.query_string,
    sa.search_count,
    sa.last_searched,
    sa.resolved,
    similarity(sa.query_string, p_query) AS similarity_score
  FROM search_analytics sa
  WHERE
    sa.resolved = false
    AND similarity(sa.query_string, p_query) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8h. get_site_stats
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS TABLE (
  total_animes         BIGINT,
  total_fansub_groups  BIGINT,
  total_translations   BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM animes),
    (SELECT count(*) FROM fansub_groups WHERE is_active = true),
    (SELECT count(*) FROM translations);
END;
$$ LANGUAGE plpgsql STABLE;

-- 8i. update_inactive_groups
CREATE OR REPLACE FUNCTION update_inactive_groups()
RETURNS INTEGER AS $$
DECLARE
  threshold_months INTEGER;
  updated_count    INTEGER;
BEGIN
  SELECT value::INTEGER INTO threshold_months
  FROM site_settings
  WHERE key = 'inactivity_threshold_months';

  IF threshold_months IS NULL THEN
    threshold_months := 6;
  END IF;

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

-- 8j. show_limit / show_trgm (debugging helpers)
CREATE OR REPLACE FUNCTION show_limit()
RETURNS FLOAT AS $$
  SELECT current_setting('pg_trgm.similarity_threshold')::FLOAT;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION show_trgm(text)
RETURNS TEXT[] AS $$
  SELECT show_trgm($1);
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 9. Seed default form fields (only if none exist)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM form_fields WHERE form_name = 'fansub_registration') THEN
    INSERT INTO form_fields (form_name, field_key, field_label_he, field_label_en, field_type, is_required, sort_order, is_active, placeholder_he)
    VALUES
      ('fansub_registration', 'name',         'שם הקבוצה',        'Group Name',     'text',     true,  1, true, 'הכנס את שם הקבוצה'),
      ('fansub_registration', 'description',  'תיאור הקבוצה',     'Description',    'textarea', true,  2, true, 'תאר את הקבוצה בקצרה'),
      ('fansub_registration', 'website_url',  'אתר אינטרנט',      'Website URL',    'url',      false, 3, true, 'https://'),
      ('fansub_registration', 'discord_url',  'קישור Discord',     'Discord URL',    'url',      false, 4, true, 'https://discord.gg/...'),
      ('fansub_registration', 'telegram_url', 'קישור Telegram',    'Telegram URL',   'url',      false, 5, true, 'https://t.me/...'),
      ('fansub_registration', 'logo_url',     'לוגו הקבוצה',      'Logo URL',       'url',      false, 6, true, 'https://...'),
      ('fansub_registration', 'founded_at',   'תאריך הקמה',       'Founded Date',   'date',     false, 7, true, NULL),
      ('fansub_registration', 'contact_email','אימייל ליצירת קשר', 'Contact Email',  'email',    false, 8, true, NULL);
  END IF;
END $$;

-- ============================================================
-- 10. Set admin user
-- ============================================================
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'meircrombie@gmail.com');
