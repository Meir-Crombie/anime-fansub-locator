-- Moderation requests table for content reporting
CREATE TYPE moderation_status AS ENUM ('pending', 'approved_deleted', 'rejected');

CREATE TABLE IF NOT EXISTS moderation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_item_id UUID NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('review', 'comment', 'translation')),
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status moderation_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE moderation_requests ENABLE ROW LEVEL SECURITY;

-- Managers can create reports, admins can read all
CREATE POLICY "managers_create_moderation" ON moderation_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "managers_read_own_moderation" ON moderation_requests FOR SELECT
  USING (auth.uid() = requested_by);

CREATE POLICY "admin_all_moderation" ON moderation_requests FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- Add new columns to user_submissions for genres/credits/cover
ALTER TABLE user_submissions
  ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(512),
  ADD COLUMN IF NOT EXISTS genres TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS credits TEXT,
  ADD COLUMN IF NOT EXISTS fansub_name_custom VARCHAR(255);

-- RLS policy for admin insert on animes (fix for managers crash)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_insert_animes' AND tablename = 'animes'
  ) THEN
    CREATE POLICY "admin_insert_animes" ON animes FOR INSERT
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Super admin delete policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'super_admin_delete_fansubs' AND tablename = 'fansub_groups'
  ) THEN
    CREATE POLICY "super_admin_delete_fansubs" ON fansub_groups FOR DELETE
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admin_delete_translations' AND tablename = 'translations'
  ) THEN
    CREATE POLICY "admin_delete_translations" ON translations FOR DELETE
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Add total_episodes column to animes for episode length filtering
ALTER TABLE animes ADD COLUMN IF NOT EXISTS total_episodes INTEGER;
