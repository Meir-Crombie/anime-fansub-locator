-- Allow managers to INSERT new anime entries when submitting translations
-- This supplements the existing admin_write_animes (FOR ALL) and admin_insert_animes policies

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'manager_insert_animes' AND tablename = 'animes'
  ) THEN
    CREATE POLICY "manager_insert_animes" ON animes FOR INSERT
      WITH CHECK (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin', 'super_admin')
      );
  END IF;
END $$;

-- Allow managers to update cover_image_url on existing animes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'manager_update_animes' AND tablename = 'animes'
  ) THEN
    CREATE POLICY "manager_update_animes" ON animes FOR UPDATE
      USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin', 'super_admin')
      );
  END IF;
END $$;
