-- Migration: Add extended profile fields to fansub_groups
-- Run this against your Supabase project via the SQL Editor or CLI

ALTER TABLE fansub_groups
  ADD COLUMN IF NOT EXISTS established_year     INTEGER,
  ADD COLUMN IF NOT EXISTS activity_status      VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (activity_status IN ('active', 'on_break', 'inactive')),
  ADD COLUMN IF NOT EXISTS translation_domains  TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flagship_projects    TEXT,
  ADD COLUMN IF NOT EXISTS is_recruiting        BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recruiting_roles     TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recruitment_contact  TEXT,
  ADD COLUMN IF NOT EXISTS submitter_name       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS submitter_role       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS submitter_contact    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_url         VARCHAR(512);

-- Add CHECK constraint for established_year range
ALTER TABLE fansub_groups
  ADD CONSTRAINT fansub_established_year_range
    CHECK (established_year IS NULL OR (established_year >= 1990 AND established_year <= 2100));
